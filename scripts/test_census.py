"""Quick test of Census Geocoder API with 3 known MD addresses."""
import urllib.request

test_csv = (
    "Unique ID,Street address,City,State,ZIP\n"
    "1,126 Port Street,Easton,MD,21601\n"
    "2,9311 Gaither Rd,Gaithersburg,MD,20877\n"
    "3,4900 Puerto Rico Ave NE,Washington,DC,20017\n"
)

boundary = "boundary123"
body = (
    f"--{boundary}\r\n"
    "Content-Disposition: form-data; name=\"addressFile\"; filename=\"addr.csv\"\r\n"
    "Content-Type: text/plain\r\n\r\n"
    + test_csv
    + f"\r\n--{boundary}\r\n"
    "Content-Disposition: form-data; name=\"benchmark\"\r\n\r\n"
    "Public_AR_Current"
    f"\r\n--{boundary}--\r\n"
).encode("utf-8")

req = urllib.request.Request(
    "https://geocoding.geo.census.gov/geocoder/locations/addressbatch",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    method="POST",
)
with urllib.request.urlopen(req, timeout=30) as r:
    print(r.read().decode("utf-8"))
