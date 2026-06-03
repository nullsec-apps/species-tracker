import { useCallback, useEffect, useRef, useState } from "react";
import type { Occurrence } from "@/types";
import { getOccurrences } from "@/lib/gbif";

export type RangeStatus = "idle" | "loading" | "ready" | "empty" | "error";

const cache = new Map<string, Occurrence[]>();

export function useRangeMap(
  taxonKey: string | number | null | undefined,
  limit = 300
) {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [status, setStatus] = useState<RangeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const load = useCallback(
    async (key: string | number) => {
      const cacheKey = `${key}:${limit}`;
      const id = ++reqId.current;
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        setOccurrences(cached);
        setStatus(cached.length ? "ready" : "empty");
        return;
      }
      setStatus("loading");
      setError(null);
      try {
        const occ = await getOccurrences(key, limit);
        if (id !== reqId.current) return;
        cache.set(cacheKey, occ);
        setOccurrences(occ);
        setStatus(occ.length ? "ready" : "empty");
      } catch (e: any) {
        if (id !== reqId.current) return;
        setError(e?.message || "Could not load occurrence records.");
        setStatus("error");
      }
    },
    [limit]
  );

  useEffect(() => {
    if (taxonKey == null || taxonKey === "") {
      setOccurrences([]);
      setStatus("idle");
      return;
    }
    void load(taxonKey);
  }, [taxonKey, load]);

  const refresh = useCallback(() => {
    if (taxonKey == null || taxonKey === "") return;
    cache.delete(`${taxonKey}:${limit}`);
    void load(taxonKey);
  }, [taxonKey, limit, load]);

  const bounds = (() => {
    if (!occurrences.length) return null;
    let minLat = 90,
      maxLat = -90,
      minLng = 180,
      maxLng = -180;
    for (const o of occurrences) {
      if (o.latitude < minLat) minLat = o.latitude;
      if (o.latitude > maxLat) maxLat = o.latitude;
      if (o.longitude < minLng) minLng = o.longitude;
      if (o.longitude > maxLng) maxLng = o.longitude;
    }
    return { minLat, maxLat, minLng, maxLng };
  })();

  const center = bounds
    ? ([
        (bounds.minLat + bounds.maxLat) / 2,
        (bounds.minLng + bounds.maxLng) / 2,
      ] as [number, number])
    : ([20, 0] as [number, number]);

  return {
    occurrences,
    status,
    error,
    refresh,
    bounds,
    center,
    count: occurrences.length,
  };
}
