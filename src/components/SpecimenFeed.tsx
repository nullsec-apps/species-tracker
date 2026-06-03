import { useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, WifiOff, RefreshCw, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SpecimenCard } from "@/components/SpecimenCard";
import { EmptyObservationState } from "@/components/EmptyObservationState";
import { matchesFilter, normalizeChain } from "@/lib/taxonomy";
import type {
  Observation,
  SpeciesRecord,
  TaxonomyFilter,
} from "@/types";
import type { NearbySpecies } from "@/hooks/useNearbyOccurrences";
import { cn } from "@/lib/utils";

interface SpecimenFeedProps {
  observations: Observation[];
  species?: SpeciesRecord[];
  status: "loading" | "ready" | "error" | "offline";
  error?: string | null;
  filter: TaxonomyFilter;
  onFilter?: (f: NonNullable<TaxonomyFilter>) => void;
  onReload?: () => void;
  onDelete?: (id: string) => void;
  onStart?: () => void;
  onPickNearby?: (s: NearbySpecies) => void;
  className?: string;
}

const HABITAT_BAND =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&q=70&auto=format&fit=crop";

export function SpecimenFeed({
  observations,
  species = [],
  status,
  error,
  filter,
  onFilter,
  onReload,
  onDelete,
  onStart,
  onPickNearby,
  className,
}: SpecimenFeedProps) {
  const filteredObs = useMemo(
    () =>
      filter
        ? observations.filter((o) =>
            matchesFilter(normalizeChain(o.taxonomy || {}), filter)
          )
        : observations,
    [observations, filter]
  );

  const filteredSpecies = useMemo(
    () =>
      filter
        ? species.filter((s) =>
            matchesFilter(normalizeChain(s.taxonomy_chain || s), filter)
          )
        : species,
    [species, filter]
  );

  if (status === "loading") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
          <Loader2 size={16} className="animate-spin text-[var(--moss-accent)]" />
          Pressing specimens…
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-[5px] border border-[rgba(124,122,102,0.25)] bg-[var(--paper-surface)] p-4 sm:flex-row"
          >
            <Skeleton className="h-44 w-full bg-[rgba(124,122,102,0.12)] sm:h-32 sm:w-44" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-2/3 bg-[rgba(124,122,102,0.12)]" />
              <Skeleton className="h-4 w-1/2 bg-[rgba(124,122,102,0.1)]" />
              <Skeleton className="h-5 w-3/4 bg-[rgba(124,122,102,0.08)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-[5px] border border-[rgba(192,97,43,0.35)] bg-[rgba(192,97,43,0.06)] px-6 py-12 text-center",
          className
        )}
      >
        <AlertTriangle size={26} className="text-[var(--terracotta-accent)]" />
        <p className="font-serif text-base italic text-[var(--ink-text)]">
          {error || "Couldn’t load the field journal."}
        </p>
        {onReload && (
          <Button
            variant="outline"
            onClick={onReload}
            className="h-10 gap-2 border-[rgba(124,122,102,0.4)]"
          >
            <RefreshCw size={15} />
            Try again
          </Button>
        )}
      </motion.div>
    );
  }

  if (status === "offline") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-[5px] border border-dashed border-[rgba(124,122,102,0.4)] bg-[rgba(251,248,240,0.5)] px-6 py-12 text-center",
          className
        )}
      >
        <WifiOff size={24} className="text-[var(--ink-muted)]" strokeWidth={1.5} />
        <p className="font-serif text-base italic text-[var(--ink-text)]">
          Field journal is running locally.
        </p>
        <p className="max-w-sm text-sm text-[var(--ink-muted)]">
          Observations you press this session stay on this device until storage
          is connected.
        </p>
      </div>
    );
  }

  const hasContent = filteredObs.length > 0 || filteredSpecies.length > 0;

  if (!hasContent && !filter) {
    return (
      <div className={className}>
        <EmptyObservationState onStart={onStart} onPickSpecies={onPickNearby} />
      </div>
    );
  }

  if (!hasContent && filter) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-[5px] border border-dashed border-[rgba(124,122,102,0.4)] bg-[rgba(251,248,240,0.5)] px-6 py-14 text-center",
          className
        )}
      >
        <Sprout size={22} className="text-[var(--moss-accent)]" strokeWidth={1.5} />
        <p className="font-serif text-base italic text-[var(--ink-text)]">
          No specimens match{" "}
          <span className="font-semibold not-italic text-[var(--moss-accent)]">
            {filter.value}
          </span>
          .
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          Clear the filter or press a new sighting in this group.
        </p>
      </motion.div>
    );
  }

  // interleave a habitat band after the first ~3 observations
  const obsBeforeBand = filteredObs.slice(0, 3);
  const obsAfterBand = filteredObs.slice(3);
  const showBand = filteredObs.length > 3;

  return (
    <div className={cn("space-y-4", className)}>
      {obsBeforeBand.map((o, i) => (
        <SpecimenCard
          key={o.id || `obs-${i}`}
          observation={o}
          index={i}
          onRankClick={onFilter}
          onDelete={onDelete}
        />
      ))}

      {showBand && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative -mx-1 h-40 overflow-hidden rounded-[5px] sm:h-48"
        >
          <img
            src={HABITAT_BAND}
            alt="Habitat"
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(44,51,36,0.55)] to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="font-display text-lg font-semibold text-[var(--paper-surface)] sm:text-2xl">
              Every sighting tells the story of a place.
            </p>
            <p className="mt-1 font-serif text-sm italic text-[rgba(251,248,240,0.85)]">
              Keep pressing the wild you walk through.
            </p>
          </div>
        </motion.div>
      )}

      {obsAfterBand.map((o, i) => (
        <SpecimenCard
          key={o.id || `obs-after-${i}`}
          observation={o}
          index={i + 3}
          onRankClick={onFilter}
          onDelete={onDelete}
        />
      ))}

      {filteredSpecies.length > 0 && (
        <>
          <div className="flex items-center gap-3 pb-1 pt-4">
            <span className="h-px flex-1 bg-[rgba(124,122,102,0.3)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              From the field guide
            </span>
            <span className="h-px flex-1 bg-[rgba(124,122,102,0.3)]" />
          </div>
          {filteredSpecies.map((s, i) => (
            <SpecimenCard
              key={s.id || s.gbif_taxon_key || `sp-${i}`}
              species={s}
              index={i}
              onRankClick={onFilter}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default SpecimenFeed;
