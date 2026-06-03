export interface TaxonomyRank {
  rank: string;
  name: string;
  key?: string | null;
}

export interface TaxonomyChain {
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  [key: string]: string | undefined;
}

export interface SpeciesRecord {
  id?: string;
  gbif_taxon_key?: string | null;
  scientific_name: string;
  common_name?: string | null;
  kingdom?: string | null;
  phylum?: string | null;
  class?: string | null;
  order_name?: string | null;
  family?: string | null;
  genus?: string | null;
  taxonomy_chain?: TaxonomyChain | null;
  iucn_status?: string | null;
  occurrence_count?: number | null;
  thumbnail_url?: string | null;
  range_map?: Occurrence[] | null;
  raw?: any;
  last_verified_at?: string | null;
  created_at?: string;
}

export interface Observation {
  id?: string;
  observer_name?: string | null;
  species_id?: string | null;
  common_name?: string | null;
  scientific_name: string;
  gbif_taxon_key?: string | null;
  taxonomy?: TaxonomyChain | null;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  observed_at?: string | null;
  photo_url?: string | null;
  notes?: string | null;
  iucn_status?: string | null;
  verification_status?: string | null;
  created_at?: string;
}

export interface Occurrence {
  id?: string;
  species_id?: string | null;
  gbif_taxon_key?: string | null;
  scientific_name?: string | null;
  latitude: number;
  longitude: number;
  occurred_on?: string | null;
  source?: string | null;
  raw?: any;
  created_at?: string;
}

export interface SpeciesSuggestion {
  key: string;
  scientificName: string;
  canonicalName?: string;
  commonName?: string | null;
  rank?: string;
  kingdom?: string;
  class?: string;
}

export interface SpeciesMatch {
  usageKey?: number;
  scientificName?: string;
  canonicalName?: string;
  rank?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  kingdomKey?: number;
  classKey?: number;
  status?: string;
  matchType?: string;
}

export interface ObserverIdentity {
  name: string;
  createdAt: string;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
  locationName?: string;
}

export type TaxonomyFilter = {
  rank: string;
  value: string;
} | null;
