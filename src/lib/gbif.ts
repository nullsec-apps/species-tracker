import type {
  SpeciesSuggestion,
  SpeciesMatch,
  Occurrence,
  TaxonomyChain,
} from "@/types";

const PROXY = "https://api.nullsec.studio/fetch-url";

function appId(): string {
  return (window as any).__NULLSEC__?.projectId || "species";
}

async function fetchUrl<T = any>(url: string): Promise<T> {
  const res = await fetch(PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, appId: appId() }),
  });
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  const text = await res.text();
  // The proxy may wrap content; try to parse JSON directly, else extract.
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && "contents" in parsed) {
      return JSON.parse((parsed as any).contents);
    }
    if (parsed && typeof parsed === "object" && "body" in parsed && typeof (parsed as any).body === "string") {
      try {
        return JSON.parse((parsed as any).body);
      } catch {
        return parsed as T;
      }
    }
    return parsed as T;
  } catch {
    // last resort: find JSON object/array in text
    const match = text.match(/[[{][\s\S]*[\]}]/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Unable to parse GBIF response");
  }
}

export async function suggestSpecies(q: string): Promise<SpeciesSuggestion[]> {
  if (!q || q.trim().length < 2) return [];
  const url = `https://api.gbif.org/v1/species/suggest?limit=8&q=${encodeURIComponent(
    q.trim()
  )}`;
  const data = await fetchUrl<any[]>(url);
  if (!Array.isArray(data)) return [];
  return data.map((d) => ({
    key: String(d.key ?? d.nubKey ?? ""),
    scientificName: d.scientificName || d.canonicalName || "",
    canonicalName: d.canonicalName,
    commonName: d.vernacularName || null,
    rank: d.rank,
    kingdom: d.kingdom,
    class: d.class,
  }));
}

export async function matchSpecies(name: string): Promise<SpeciesMatch> {
  const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(
    name
  )}`;
  return fetchUrl<SpeciesMatch>(url);
}

export async function getSpeciesByKey(key: string | number): Promise<any> {
  const url = `https://api.gbif.org/v1/species/${key}`;
  return fetchUrl<any>(url);
}

export async function getVernacularName(
  key: string | number
): Promise<string | null> {
  try {
    const url = `https://api.gbif.org/v1/species/${key}/vernacularNames?limit=40`;
    const data = await fetchUrl<any>(url);
    const results: any[] = data?.results || [];
    const en = results.find(
      (r) => (r.language === "eng" || r.language === "en") && r.vernacularName
    );
    return (en?.vernacularName || results[0]?.vernacularName || null) ?? null;
  } catch {
    return null;
  }
}

export async function getOccurrenceCount(
  taxonKey: string | number
): Promise<number> {
  const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=${taxonKey}&limit=0`;
  const data = await fetchUrl<any>(url);
  return typeof data?.count === "number" ? data.count : 0;
}

export async function getOccurrences(
  taxonKey: string | number,
  limit = 300
): Promise<Occurrence[]> {
  const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=${taxonKey}&hasCoordinate=true&limit=${limit}`;
  const data = await fetchUrl<any>(url);
  const results: any[] = data?.results || [];
  return results
    .filter(
      (r) => typeof r.decimalLatitude === "number" && typeof r.decimalLongitude === "number"
    )
    .map((r) => ({
      gbif_taxon_key: String(taxonKey),
      scientific_name: r.scientificName || null,
      latitude: r.decimalLatitude,
      longitude: r.decimalLongitude,
      occurred_on: r.eventDate || null,
      source: r.datasetName || "GBIF",
    }));
}

export async function getNearbyOccurrences(
  lat: number,
  lng: number,
  radiusKm = 5,
  sinceDays = 7
): Promise<Occurrence[]> {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);
  const wkt = `POLYGON((${(lng - dLng).toFixed(4)} ${(lat - dLat).toFixed(
    4
  )},${(lng + dLng).toFixed(4)} ${(lat - dLat).toFixed(4)},${(lng + dLng).toFixed(
    4
  )} ${(lat + dLat).toFixed(4)},${(lng - dLng).toFixed(4)} ${(lat + dLat).toFixed(
    4
  )},${(lng - dLng).toFixed(4)} ${(lat - dLat).toFixed(4)}))`;
  const since = new Date(Date.now() - sinceDays * 864e5)
    .toISOString()
    .slice(0, 10);
  const url = `https://api.gbif.org/v1/occurrence/search?geometry=${encodeURIComponent(
    wkt
  )}&eventDate=${since},${new Date()
    .toISOString()
    .slice(0, 10)}&hasCoordinate=true&limit=120`;
  const data = await fetchUrl<any>(url);
  const results: any[] = data?.results || [];
  return results
    .filter(
      (r) => typeof r.decimalLatitude === "number" && typeof r.decimalLongitude === "number"
    )
    .map((r) => ({
      gbif_taxon_key: r.taxonKey ? String(r.taxonKey) : null,
      scientific_name: r.scientificName || r.species || null,
      latitude: r.decimalLatitude,
      longitude: r.decimalLongitude,
      occurred_on: r.eventDate || null,
      source: "GBIF",
    }));
}

export function buildTaxonomyChain(
  m: SpeciesMatch | any
): TaxonomyChain {
  return {
    kingdom: m.kingdom || undefined,
    phylum: m.phylum || undefined,
    class: m.class || undefined,
    order: m.order || undefined,
    family: m.family || undefined,
    genus: m.genus || undefined,
    species: m.species || m.canonicalName || undefined,
  };
}

export async function getIucnStatus(
  scientificName: string
): Promise<string | null> {
  // GBIF exposes IUCN Red List threat status via its checklist; query distributions
  try {
    const match = await matchSpecies(scientificName);
    if (!match?.usageKey) return null;
    const url = `https://api.gbif.org/v1/species/${match.usageKey}/iucnRedListCategory`;
    const data = await fetchUrl<any>(url);
    return data?.category || data?.code || null;
  } catch {
    return null;
  }
}
