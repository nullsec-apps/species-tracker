import { useCallback, useEffect, useRef, useState } from "react";
import type { Occurrence, GeoPosition } from "@/types";
import { getCurrentPosition, reverseGeocode } from "@/lib/geo";
import { getNearbyOccurrences } from "@/lib/gbif";

export type NearbyStatus =
  | "idle"
  | "locating"
  | "loading"
  | "ready"
  | "denied"
  | "error";

export interface NearbySpecies {
  scientificName: string;
  gbifTaxonKey: string | null;
  count: number;
  latitude: number;
  longitude: number;
  occurredOn: string | null;
}

function dedupeBySpecies(occ: Occurrence[]): NearbySpecies[] {
  const map = new Map<string, NearbySpecies>();
  for (const o of occ) {
    const name = o.scientific_name?.trim();
    if (!name) continue;
    const existing = map.get(name);
    if (existing) {
      existing.count += 1;
      if (
        o.occurred_on &&
        (!existing.occurredOn ||
          new Date(o.occurred_on) > new Date(existing.occurredOn))
      ) {
        existing.occurredOn = o.occurred_on;
      }
    } else {
      map.set(name, {
        scientificName: name,
        gbifTaxonKey: o.gbif_taxon_key ?? null,
        count: 1,
        latitude: o.latitude,
        longitude: o.longitude,
        occurredOn: o.occurred_on ?? null,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function useNearbyOccurrences(radiusKm = 5, sinceDays = 7) {
  const [status, setStatus] = useState<NearbyStatus>("idle");
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [species, setSpecies] = useState<NearbySpecies[]>([]);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const run = useCallback(async () => {
    setStatus("locating");
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setStatus("loading");
      let locationName: string | undefined;
      try {
        locationName = await reverseGeocode(pos.latitude, pos.longitude);
      } catch {
        /* ignore */
      }
      setPosition({ ...pos, locationName });
      const occ = await getNearbyOccurrences(
        pos.latitude,
        pos.longitude,
        radiusKm,
        sinceDays
      );
      setSpecies(dedupeBySpecies(occ));
      setStatus("ready");
    } catch (e: any) {
      const msg = e?.message || "Unable to load nearby species.";
      if (/denied|permission/i.test(msg)) {
        setStatus("denied");
        setError("Location permission denied.");
      } else {
        setStatus("error");
        setError(msg);
      }
    }
  }, [radiusKm, sinceDays]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  return {
    status,
    position,
    species,
    error,
    refresh: run,
    speciesCount: species.length,
    radiusKm,
  };
}
