import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  MapPin,
  Feather,
  Globe2,
  ExternalLink,
  BookMarked,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TaxonomyChain } from "@/components/TaxonomyChain";
import { IucnStatusNote } from "@/components/IucnStatusNote";
import { RangeMap } from "@/components/RangeMap";
import {
  getSpeciesByKey,
  matchSpecies,
  getVernacularName,
  getOccurrenceCount,
  getIucnStatus,
  buildTaxonomyChain,
} from "@/lib/gbif";
import { normalizeChain } from "@/lib/taxonomy";
import { formatCount, formatFullCount, titleCase } from "@/lib/format";
import { normalizeIucn } from "@/lib/iucn";
import type { Observation, TaxonomyChain as TChain } from "@/types";
import { cn } from "@/lib/utils";

interface SpeciesDetailState {
  loading: boolean;
  error: string | null;
  scientificName: string;
  commonName: string | null;
  taxonKey: string | null;
  chain: TChain | null;
  iucn: string | null;
  occurrenceCount: number | null;
}

interface SpeciesDetailProps {
  taxonKey?: string | null;
  byName?: string | null;
  onLogSpecies?: (prefill: Partial<Observation>) => void;
}

const HABITAT =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1400&q=70&auto=format&fit=crop";

export function SpeciesDetail({
  taxonKey,
  byName,
  onLogSpecies,
}: SpeciesDetailProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<SpeciesDetailState>({
    loading: true,
    error: null,
    scientificName: "",
    commonName: null,
    taxonKey: taxonKey || null,
    chain: null,
    iucn: null,
    occurrenceCount: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        let key = taxonKey || null;
        let sciName = byName || "";
        if (!key && byName) {
          const m = await matchSpecies(byName);
          if (m?.usageKey) key = String(m.usageKey);
          sciName = m?.scientificName || byName;
        }
        if (!key) {
          if (cancelled) return;
          setState((s) => ({
            ...s,
            loading: false,
            error: "Could not resolve this species.",
          }));
          return;
        }
        const detail = await getSpeciesByKey(key);
        sciName = detail?.scientificName || sciName || String(key);
        const [common, count, iucn] = await Promise.all([
          getVernacularName(key).catch(() => null),
          getOccurrenceCount(key).catch(() => 0),
          getIucnStatus(sciName).catch(() => null),
        ]);
        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          scientificName: sciName,
          commonName: common,
          taxonKey: key,
          chain: normalizeChain(buildTaxonomyChain(detail)),
          iucn,
          occurrenceCount: count ?? null,
        });
      } catch (e: any) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: e?.message || "Could not load this species.",
        }));
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [taxonKey, byName]);

  const {
    loading,
    error,
    scientificName,
    commonName,
    chain,
    iucn,
    occurrenceCount,
  } = state;

  const iucnInfo = normalizeIucn(iucn);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-32 bg-[rgba(124,122,102,0.1)]" />
        <Skeleton className="h-48 w-full bg-[rgba(124,122,102,0.1)] sm:h-64" />
        <Skeleton className="h-10 w-2/3 bg-[rgba(124,122,102,0.12)]" />
        <Skeleton className="h-6 w-1/2 bg-[rgba(124,122,102,0.1)]" />
        <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
          <Loader2 size={16} className="animate-spin text-[var(--moss-accent)]" />
          Pulling records from GBIF & IUCN…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[5px] border border-[rgba(192,97,43,0.35)] bg-[rgba(192,97,43,0.06)] px-6 py-14 text-center">
        <AlertTriangle size={26} className="text-[var(--terracotta-accent)]" />
        <p className="font-serif text-base italic text-[var(--ink-text)]">
          {error}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="h-10 gap-2 border-[rgba(124,122,102,0.4)]"
        >
          <ArrowLeft size={15} />
          Go back
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 h-9 gap-1.5 px-2 text-sm text-[var(--ink-muted)] transition-colors hover:bg-[rgba(91,123,58,0.08)] hover:text-[var(--moss-accent)]"
      >
        <ArrowLeft size={16} />
        Back to field guide
      </Button>

      {/* habitat band */}
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-44 overflow-hidden rounded-[6px] border border-[rgba(124,122,102,0.25)] sm:h-60"
      >
        <img
          src={HABITAT}
          alt="Habitat"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(44,51,36,0.72)] via-[rgba(44,51,36,0.15)] to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          {commonName && (
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(251,248,240,0.82)]">
              {iucnInfo ? `IUCN · ${iucnInfo.label}` : "Field guide entry"}
            </span>
          )}
          <h1 className="font-display text-3xl font-semibold leading-[1.05] text-[var(--paper-surface)] sm:text-4xl lg:text-5xl">
            {commonName ? titleCase(commonName) : scientificName}
          </h1>
          <p className="mt-1 font-serif text-lg italic text-[rgba(251,248,240,0.9)]">
            {scientificName}
          </p>
        </div>
      </motion.div>

      {/* margin notes row */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {iucn && <IucnStatusNote status={iucn} size="lg" />}
        {occurrenceCount != null && (
          <span className="flex items-center gap-1.5 rounded-sm border border-[rgba(124,122,102,0.3)] bg-[var(--paper-surface)] px-3 py-1 text-sm text-[var(--ink-text)]">
            <MapPin size={14} className="text-[var(--moss-accent)]" />
            <span className="font-semibold">
              {formatCount(occurrenceCount)}
            </span>
            <span className="text-[var(--ink-muted)]">verified observations</span>
          </span>
        )}
        <a
          href={`https://www.gbif.org/species/${state.taxonKey}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-sm border border-[rgba(124,122,102,0.3)] bg-[var(--paper-surface)] px-3 py-1 text-sm text-[var(--ink-muted)] transition-all duration-200 hover:border-[var(--moss-accent)] hover:text-[var(--moss-accent)]"
        >
          <ExternalLink size={13} />
          View on GBIF
        </a>
      </div>

      {onLogSpecies && (
        <Button
          onClick={() =>
            onLogSpecies({
              scientific_name: scientificName,
              common_name: commonName,
              gbif_taxon_key: state.taxonKey,
              taxonomy: chain,
              iucn_status: iucn,
            })
          }
          className="mt-4 h-11 gap-2 bg-[var(--terracotta-accent)] px-5 text-[var(--paper-surface)] shadow-sm transition-all duration-200 hover:bg-[#a8511f] hover:shadow-md"
        >
          <Feather size={16} />
          Log this species
        </Button>
      )}

      <Separator className="my-6 bg-[rgba(124,122,102,0.25)]" />

      <Tabs defaultValue="taxonomy" className="w-full">
        <TabsList className="h-11 gap-1 border border-[rgba(124,122,102,0.25)] bg-[var(--paper-surface)] p-1">
          <TabsTrigger
            value="taxonomy"
            className="gap-1.5 text-sm data-[state=active]:bg-[rgba(91,123,58,0.14)] data-[state=active]:text-[var(--moss-accent)]"
          >
            <BookMarked size={14} />
            Taxonomy
          </TabsTrigger>
          <TabsTrigger
            value="range"
            className="gap-1.5 text-sm data-[state=active]:bg-[rgba(91,123,58,0.14)] data-[state=active]:text-[var(--moss-accent)]"
          >
            <Globe2 size={14} />
            Range map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="taxonomy" className="mt-5">
          <div className="rounded-[6px] border border-[rgba(124,122,102,0.25)] bg-[var(--paper-surface)] p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Classification chain
            </p>
            <TaxonomyChain chain={chain} />
            {occurrenceCount != null && (
              <p className="mt-5 font-serif text-sm italic text-[var(--ink-muted)]">
                {formatFullCount(occurrenceCount)} georeferenced occurrence
                records have been catalogued for this taxon worldwide.
              </p>
            )}
            {iucnInfo && (
              <div
                className="mt-4 rounded-[4px] border-l-4 px-4 py-3"
                style={{
                  borderColor: iucnInfo.color,
                  backgroundColor: iucnInfo.bg,
                }}
              >
                <p
                  className="font-display text-sm font-semibold"
                  style={{ color: iucnInfo.color }}
                >
                  {iucnInfo.label} ({iucnInfo.short})
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                  {iucnInfo.description}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="range" className="mt-5">
          <div className="overflow-hidden rounded-[6px] border border-[rgba(124,122,102,0.25)] bg-[var(--paper-surface)]">
            <RangeMap taxonKey={state.taxonKey} height={420} />
          </div>
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            Each dot is a real georeferenced occurrence record from GBIF.
          </p>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default SpeciesDetail;
