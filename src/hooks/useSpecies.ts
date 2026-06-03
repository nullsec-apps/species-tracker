import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeciesRecord, TaxonomyFilter } from "@/types";
import {
  supabase,
  SPECIES_TABLE,
  hasSupabase,
} from "@/lib/supabaseClient";
import {
  matchSpecies,
  getSpeciesByKey,
  getVernacularName,
  getOccurrenceCount,
  getIucnStatus,
  buildTaxonomyChain,
} from "@/lib/gbif";
import { normalizeChain, matchesFilter } from "@/lib/taxonomy";

export type SpeciesStatus = "loading" | "ready" | "error" | "offline";

function toRecord(raw: any, extra: Partial<SpeciesRecord> = {}): SpeciesRecord {
  const chain = buildTaxonomyChain(raw);
  return {
    gbif_taxon_key: raw.usageKey ? String(raw.usageKey) : raw.key ? String(raw.key) : null,
    scientific_name: raw.scientificName || raw.canonicalName || extra.scientific_name || "",
    common_name: extra.common_name ?? raw.vernacularName ?? null,
    kingdom: raw.kingdom ?? null,
    phylum: raw.phylum ?? null,
    class: raw.class ?? null,
    order_name: raw.order ?? null,
    family: raw.family ?? null,
    genus: raw.genus ?? null,
    taxonomy_chain: chain,
    iucn_status: extra.iucn_status ?? null,
    occurrence_count: extra.occurrence_count ?? null,
    raw,
    last_verified_at: new Date().toISOString(),
    ...extra,
  };
}

export function useSpecies() {
  const [species, setSpecies] = useState<SpeciesRecord[]>([]);
  const [status, setStatus] = useState<SpeciesStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaxonomyFilter>(null);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    if (!hasSupabase()) {
      setStatus("offline");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from(SPECIES_TABLE())
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (err) throw err;
      setSpecies((data as SpeciesRecord[]) || []);
      setStatus("ready");
    } catch (e: any) {
      setError(e?.message || "Failed to load species.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void load();
  }, [load]);

  const persist = useCallback(
    async (record: SpeciesRecord): Promise<SpeciesRecord> => {
      if (!hasSupabase()) {
        const local = { ...record, id: record.id || crypto.randomUUID() };
        setSpecies((prev) =>
          prev.some((p) => p.gbif_taxon_key === local.gbif_taxon_key)
            ? prev
            : [local, ...prev]
        );
        return local;
      }
      try {
        if (record.gbif_taxon_key) {
          const { data: existing } = await supabase
            .from(SPECIES_TABLE())
            .select("*")
            .eq("gbif_taxon_key", record.gbif_taxon_key)
            .limit(1);
          if (existing && existing.length) {
            const merged = { ...existing[0], ...record, id: existing[0].id };
            await supabase
              .from(SPECIES_TABLE())
              .update({
                iucn_status: merged.iucn_status,
                occurrence_count: merged.occurrence_count,
                common_name: merged.common_name,
                taxonomy_chain: merged.taxonomy_chain,
                last_verified_at: merged.last_verified_at,
              })
              .eq("id", existing[0].id);
            setSpecies((prev) =>
              prev.map((p) => (p.id === merged.id ? merged : p))
            );
            return merged;
          }
        }
        const { data, error: err } = await supabase
          .from(SPECIES_TABLE())
          .insert(record)
          .select()
          .single();
        if (err) throw err;
        const row = data as SpeciesRecord;
        setSpecies((prev) =>
          prev.some((p) => p.id === row.id) ? prev : [row, ...prev]
        );
        return row;
      } catch {
        const local = { ...record, id: record.id || crypto.randomUUID() };
        setSpecies((prev) =>
          prev.some((p) => p.gbif_taxon_key === local.gbif_taxon_key)
            ? prev
            : [local, ...prev]
        );
        return local;
      }
    },
    []
  );

  const enrichByName = useCallback(
    async (scientificName: string): Promise<SpeciesRecord | null> => {
      try {
        const match = await matchSpecies(scientificName);
        if (!match?.usageKey) {
          return toRecord({ scientificName }, { scientific_name: scientificName });
        }
        const [detail, common, count, iucn] = await Promise.all([
          getSpeciesByKey(match.usageKey).catch(() => match),
          getVernacularName(match.usageKey).catch(() => null),
          getOccurrenceCount(match.usageKey).catch(() => 0),
          getIucnStatus(scientificName).catch(() => null),
        ]);
        const record = toRecord(
          { ...match, ...detail },
          {
            scientific_name: match.scientificName || scientificName,
            common_name: common,
            occurrence_count: count,
            iucn_status: iucn,
          }
        );
        return await persist(record);
      } catch (e: any) {
        setError(e?.message || "Could not enrich species.");
        return null;
      }
    },
    [persist]
  );

  const enrichByKey = useCallback(
    async (taxonKey: string | number): Promise<SpeciesRecord | null> => {
      try {
        const detail = await getSpeciesByKey(taxonKey);
        const sciName =
          detail.scientificName || detail.canonicalName || String(taxonKey);
        const [common, count, iucn] = await Promise.all([
          getVernacularName(taxonKey).catch(() => null),
          getOccurrenceCount(taxonKey).catch(() => 0),
          getIucnStatus(sciName).catch(() => null),
        ]);
        const record = toRecord(detail, {
          scientific_name: sciName,
          common_name: common,
          occurrence_count: count,
          iucn_status: iucn,
        });
        return await persist(record);
      } catch (e: any) {
        setError(e?.message || "Could not load species details.");
        return null;
      }
    },
    [persist]
  );

  const filtered = filter
    ? species.filter((s) =>
        matchesFilter(normalizeChain(s.taxonomy_chain || s), filter)
      )
    : species;

  return {
    species,
    filtered,
    status,
    error,
    filter,
    setFilter,
    reload: load,
    persist,
    enrichByName,
    enrichByKey,
    count: species.length,
  };
}
