import requests
import pandas as pd
import geopandas as gpd
from shapely.geometry import shape

# ----------------------------
# CONFIG
# ----------------------------
TRACT_LAYER_URL = "https://gis.princegeorgescountymd.gov/arcgis/rest/services/Health/Healthy_Food_Map/MapServer/6/query"
MUNI_LAYER_URL = "https://gis.princegeorgescountymd.gov/arcgis/rest/services/BOUNDARIES/Boundaries/MapServer/1/query"

OUTPUT_TRACTS_GEOJSON = "tracts_hfpa.geojson"
OUTPUT_MUNI_GEOJSON = "municipal_boundaries.geojson"
OUTPUT_TRACTS_CSV = "tracts_hfpa.csv"
OUTPUT_MUNI_CSV = "municipal_boundaries.csv"
OUTPUT_JOINED_CSV = "tracts_with_municipality.csv"


# ----------------------------
# HELPERS
# ----------------------------
def fetch_arcgis_features(url, where="1=1", out_fields="*", return_geometry=True, result_offset=0, result_record_count=2000):
    """
    Fetch a page of ArcGIS features in JSON format.
    """
    params = {
        "where": where,
        "outFields": out_fields,
        "returnGeometry": str(return_geometry).lower(),
        "f": "json",
        "resultOffset": result_offset,
        "resultRecordCount": result_record_count
    }

    response = requests.get(url, params=params, timeout=60)
    response.raise_for_status()
    data = response.json()

    if "error" in data:
        raise RuntimeError(f"ArcGIS API error: {data['error']}")

    return data


def fetch_all_arcgis_features(url, where="1=1", out_fields="*", return_geometry=True, batch_size=2000):
    """
    Fetch all features from an ArcGIS layer using pagination.
    """
    all_features = []
    offset = 0

    while True:
        data = fetch_arcgis_features(
            url=url,
            where=where,
            out_fields=out_fields,
            return_geometry=return_geometry,
            result_offset=offset,
            result_record_count=batch_size
        )

        features = data.get("features", [])
        all_features.extend(features)

        print(f"Fetched {len(features)} records at offset {offset}")

        if len(features) < batch_size:
            break

        offset += batch_size

    return all_features


def arcgis_features_to_geodataframe(features, geometry_type="esriGeometryPolygon"):
    """
    Convert ArcGIS JSON features to GeoDataFrame.
    Supports polygon geometry for your current layers.
    """
    records = []
    geometries = []

    for feature in features:
        attrs = feature.get("attributes", {})
        geom = feature.get("geometry")

        records.append(attrs)

        if geom:
            if "rings" in geom:
                # Polygon / MultiPolygon-like structure
                poly = shape({
                    "type": "Polygon",
                    "coordinates": geom["rings"]
                })
                geometries.append(poly)
            elif "x" in geom and "y" in geom:
                pt = shape({
                    "type": "Point",
                    "coordinates": (geom["x"], geom["y"])
                })
                geometries.append(pt)
            else:
                geometries.append(None)
        else:
            geometries.append(None)

    gdf = gpd.GeoDataFrame(records, geometry=geometries, crs="EPSG:2248")
    return gdf


def save_geojson_and_csv(gdf, geojson_path, csv_path):
    """
    Save a GeoDataFrame as GeoJSON and CSV.
    CSV excludes geometry.
    """
    gdf.to_file(geojson_path, driver="GeoJSON")
    gdf.drop(columns="geometry", errors="ignore").to_csv(csv_path, index=False)


# ----------------------------
# MAIN
# ----------------------------
def main():
    print("Downloading tract layer...")
    tract_features = fetch_all_arcgis_features(
        url=TRACT_LAYER_URL,
        where="1=1",
        out_fields="*",
        return_geometry=True
    )

    print("Downloading municipal boundary layer...")
    muni_features = fetch_all_arcgis_features(
        url=MUNI_LAYER_URL,
        where="1=1",
        out_fields="*",
        return_geometry=True
    )

    print("Converting tract features to GeoDataFrame...")
    tracts_gdf = arcgis_features_to_geodataframe(tract_features)

    print("Converting municipal features to GeoDataFrame...")
    muni_gdf = arcgis_features_to_geodataframe(muni_features)

    # Reproject if needed for spatial join consistency
    if tracts_gdf.crs != muni_gdf.crs:
        muni_gdf = muni_gdf.to_crs(tracts_gdf.crs)

    print("Saving raw layers...")
    save_geojson_and_csv(tracts_gdf, OUTPUT_TRACTS_GEOJSON, OUTPUT_TRACTS_CSV)
    save_geojson_and_csv(muni_gdf, OUTPUT_MUNI_GEOJSON, OUTPUT_MUNI_CSV)

    print("Performing spatial join...")
    joined = gpd.sjoin(
        tracts_gdf,
        muni_gdf[["NAME", "CITY", "ZIP_CODE", "geometry"]],
        how="left",
        predicate="intersects"
    )

    # Clean columns for final export
    final_columns = [
        "PGCOITGIS02_DBO_TRACTS_TRACT_ID",     # alias: TRACT_ID
        "PGCOITGIS02_DBO_TRACTS_TRACT__1",     # alias: TRACT_ID2
        "Healthy",
        "Unhealthy",
        "RFEI",
        "HFPA",
        "Tier",
        "NAME",                               # municipality name
        "CITY",
        "ZIP_CODE"
    ]

    available_columns = [col for col in final_columns if col in joined.columns]
    final_df = joined[available_columns].copy()

    # Rename ugly ArcGIS field names
    rename_map = {
        "PGCOITGIS02_DBO_TRACTS_TRACT_ID": "TRACT_ID",
        "PGCOITGIS02_DBO_TRACTS_TRACT__1": "TRACT_ID2",
        "NAME": "MUNICIPALITY_NAME",
        "CITY": "MUNICIPALITY_CITY",
        "ZIP_CODE": "MUNICIPALITY_ZIP"
    }
    final_df.rename(columns=rename_map, inplace=True)

    print("Saving joined CSV...")
    final_df.to_csv(OUTPUT_JOINED_CSV, index=False)

    print("\nDone.")
    print(f"Saved: {OUTPUT_TRACTS_GEOJSON}")
    print(f"Saved: {OUTPUT_MUNI_GEOJSON}")
    print(f"Saved: {OUTPUT_TRACTS_CSV}")
    print(f"Saved: {OUTPUT_MUNI_CSV}")
    print(f"Saved: {OUTPUT_JOINED_CSV}")


if __name__ == "__main__":
    main()