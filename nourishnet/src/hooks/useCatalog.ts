import { useEffect, useState } from "react";
import type { Catalog } from "../types";

const DATA_URL = `${import.meta.env.BASE_URL}data/catalog.json`;

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Catalog) => setCatalog(d))
      .catch((e: Error) => setError(e.message));
  }, []);

  return { catalog, error };
}
