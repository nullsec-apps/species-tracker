import { motion } from "framer-motion";
import { MapPin, Loader2, Compass, RefreshCw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useNearbyOccurrences,
  type NearbySpecies,
} from "@/hooks/useNearbyOccurrences";
import { formatScientificName, formatRelative, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NearbyOccurrencesProps {
  onPickSpecies?: (s: NearbySpecies) => void;
  radiusKm?: number;
  className?: string;
}

export function NearbyOccurrences({
  onPickSpecies,
  radiusKm = 5,
  className,
}: NearbyOccurrencesProps) {
  const { status, species, position, error, refresh, speciesCount } =
    useNearbyOccurrences(radiusKm, 7);

  const locating = status === "locating" || status === "loading";

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "paper-grain relative overflow-hidden rounded-[4px] border border-[rgba(124,122,102,0.25)] bg-[var(--paper-surface)] p-5 sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Compass size={20} strokeWidth={1.5} className="text-[var(--moss-accent)]" />
          <div>
            <h3 className="font-display text-lg leading-tight text-[var(--ink-text)]">
              Observed near you this week
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              {position?.locationName
                ? `Live GBIF data \u00b7 within ${radiusKm}km of ${titleCase(
                    position.locationName
                  )}`
                : `Live GBIF occurrences within ${radiusKm}km`}
            </p>
          </div>
        </div>
        {status === "ready" && (
          <Badge className="border-0 bg-[rgba(91,123,58,0.14)] px-2.5 py-1 text-[var(--moss-accent)]">
            {speciesCount} species
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={locating}
          className="h-8 px-2 text-[var(--ink-muted)] transition-all duration-200 hover:bg-[rgba(91,123,58,0.08)] hover:text-[var(--moss-accent)]"
        >
          <RefreshCw size={15} className={cn(locating && "animate-spin")} />
        </Button>
      </div>

      {locating ? (
        <div className="flex items-center gap-2 py-6 text-sm text-[var(--ink-muted)]">
          <Loader2 size={18} className="animate-spin text-[var(--moss-accent)]" />
          {status === "locating"
            ? "Getting your location\u2026"
            : "Querying nearby occurrences\u2026"}
        </div>
      ) : status === "denied" ? (
        <div className="flex items-start gap-2.5 rounded-sm border border-[rgba(192,97,43,0.3)] bg-[rgba(192,97,43,0.06)] p-4">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-[var(--terracotta-accent)]"
          />
          <div>
            <p className="text-sm font-medium text-[var(--ink-text)]">
              Location permission denied
            </p>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              Allow location access to surface real species observed near you.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="mt-2.5 h-8 border-[rgba(124,122,102,0.4)] text-xs"
            >
              <RefreshCw size={13} className="mr-1.5" />
              Try again
            </Button>
          </div>
        </div>
      ) : status === "error" ? (
        <div className="flex items-start gap-2.5 rounded-sm border border-[rgba(192,97,43,0.3)] bg-[rgba(192,97,43,0.06)] p-4">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-[var(--terracotta-accent)]"
          />
          <p className="text-sm text-[var(--ink-text)]">
            {error || "Could not load nearby species."}
          </p>
        </div>
      ) : species.length === 0 ? (
        <p className="py-6 text-sm text-[var(--ink-muted)]">
          No occurrences recorded nearby in the last week.
        </p>
      ) : (
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {species.slice(0, 24).map((s, i) => (
            <motion.button
              key={`${s.scientificName}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035, duration: 0.32 }}
              onClick={() => onPickSpecies?.(s)}
              className="group flex w-[180px] shrink-0 snap-start flex-col rounded-[4px] border border-[rgba(124,122,102,0.25)] bg-[var(--paper-bg)] p-3 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--moss-accent)] hover:shadow-[0_8px_20px_-10px_rgba(44,51,36,0.3)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <MapPin
                  size={15}
                  className="text-[var(--terracotta-accent)] transition-transform group-hover:scale-110"
                />
                {s.count > 1 && (
                  <Badge className="h-5 border-0 bg-[rgba(91,123,58,0.15)] px-1.5 text-[10px] font-semibold text-[var(--moss-accent)]">
                    {s.count} sightings
                  </Badge>
                )}
              </div>
              <p className="line-clamp-2 font-display text-sm italic leading-snug text-[var(--ink-text)] transition-colors group-hover:text-[var(--moss-accent)]">
                {formatScientificName(s.scientificName)}
              </p>
              {s.occurredOn && (
                <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">
                  {formatRelative(s.occurredOn)}
                </p>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </motion.section>
  );
}

export default NearbyOccurrences;
