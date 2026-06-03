import type { TaxonomyChain, SpeciesMatch } from "@/types";

export interface RankDef {
  key: keyof TaxonomyChain;
  label: string;
  color: string;
  abbrev: string;
}

export const RANK_ORDER: RankDef[] = [
  { key: "kingdom", label: "Kingdom", color: "#5B7B3A", abbrev: "K" },
  { key: "phylum", label: "Phylum", color: "#6E8A3D", abbrev: "P" },
  { key: "class", label: "Class", color: "#8A8A2E", abbrev: "C" },
  { key: "order", label: "Order", color: "#A88A2E", abbrev: "O" },
  { key: "family", label: "Family", color: "#C0612B", abbrev: "F" },
  { key: "genus", label: "Genus", color: "#A8492B", abbrev: "G" },
  { key: "species", label: "Species", color: "#7C3A24", abbrev: "S" },
];

export function rankColor(rank: string): string {
  const def = RANK_ORDER.find((r) => r.key === rank.toLowerCase());
  return def ? def.color : "#7C7A66";
}

export function rankLabel(rank: string): string {
  const def = RANK_ORDER.find((r) => r.key === rank.toLowerCase());
  return def ? def.label : rank.charAt(0).toUpperCase() + rank.slice(1);
}

export function normalizeChain(
  source: Partial<TaxonomyChain> | SpeciesMatch | any | null | undefined
): TaxonomyChain {
  if (!source) return {};
  return {
    kingdom: clean(source.kingdom),
    phylum: clean(source.phylum),
    class: clean(source.class),
    order: clean(source.order || source.order_name),
    family: clean(source.family),
    genus: clean(source.genus),
    species: clean(source.species || source.canonicalName),
  };
}

function clean(v: any): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

export function chainToOrderedEntries(
  chain: TaxonomyChain | null | undefined
): { rank: string; label: string; value: string; color: string }[] {
  if (!chain) return [];
  const entries: {
    rank: string;
    label: string;
    value: string;
    color: string;
  }[] = [];
  for (const def of RANK_ORDER) {
    const value = chain[def.key];
    if (value) {
      entries.push({
        rank: String(def.key),
        label: def.label,
        value,
        color: def.color,
      });
    }
  }
  return entries;
}

export function matchesFilter(
  chain: TaxonomyChain | null | undefined,
  filter: { rank: string; value: string } | null
): boolean {
  if (!filter) return true;
  if (!chain) return false;
  const v = chain[filter.rank as keyof TaxonomyChain];
  if (!v) return false;
  return v.toLowerCase() === filter.value.toLowerCase();
}

export function chainSummary(
  chain: TaxonomyChain | null | undefined
): string {
  if (!chain) return "";
  const parts = [chain.class, chain.order, chain.family].filter(Boolean);
  return parts.join(" \u203A ");
}
