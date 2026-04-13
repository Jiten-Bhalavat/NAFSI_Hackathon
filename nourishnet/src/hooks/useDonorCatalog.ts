import { useEffect, useState } from "react";
import type { DonorCatalog } from "../types";

const DATA_URL = `${import.meta.env.BASE_URL}data/donor_catalog.json`;

export function useDonorCatalog() {
  const [catalog, setCatalog] = useState<DonorCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: DonorCatalog) => setCatalog(d))
      .catch((e: Error) => setError(e.message));
  }, []);

  return { catalog, error };
}
