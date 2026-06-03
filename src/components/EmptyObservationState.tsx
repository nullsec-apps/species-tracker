import { motion } from "framer-motion";
import { Leaf, MapPin, Loader2, Sprout, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useNearbyOccurrences,
  type NearbySpecies,
} from "@/hooks/useNearbyOccurrences";
import { formatScientificName, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

interface EmptyObservationStateProps {
  onStart?: () => void;
  onPickSpecies?: (s: NearbySpecies) => void;
  className?: string;
}

export function EmptyObservationState({
  onStart,
  onPickSpecies,
  className,
}: EmptyObservationStateProps) {
  const { status, species, position, error, refresh, speciesCount, radiusKm } =
    useNearbyOccurrences(5, 7);

  const locating = status === "locating" || status === "loading";
  const denied = status === "denied";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("w-full", className)}
    >
      <div className="paper-grain relative overflow-hidden rounded-[4px] border-2 border-dashed border-[rgba(124,122,102,0.4)] bg-[rgba(251,248,240,0.5)] p-6 sm:p-10">
        {/* Faded sepia herbarium sheet outline */}
        <div className="pointer-events-none absolute right-4 top-4 opacity-[0.08]">
          <Leaf size={120} strokeWidth={0.75} className="text-[var(--ink-text)]" />
        </div>

        <div className="relative max-w-2xl">
          <div className="mb-3 flex items-center gap-2">
            <Sprout size={20} strokeWidth={1.5} className="text-[var(--moss-accent)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Field Journal
            </span>
          </div>

          <h3 className="font-display text-2xl leading-tight text-[var(--ink-text)] sm:text-3xl">
            No specimens pressed yet
          </h3>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
            {status === "ready" && speciesCount > 0 ? (
              <>
                But{" "}
                <span className="font-semibold text-[var(--moss-accent)]">
                  {speciesCount} species
                </span>{" "}
                were observed within {radiusKm}km of you this week
                {position?.locationName ? ` near ${position.locationName}` : ""}.
                Press one of these to start your collection.
              </>
            ) : locating ? (
              "Finding what's been observed near you this week\u2026"
            ) : denied ? (
              "Enable location to see real species observed near you \u2014 or start your first observation manually."
            ) : (
              "Start your first observation, or let us surface real species seen near you this week."
            )}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              onClick={onStart}
              className="h-11 bg-[var(--moss-accent)] px-5 text-[var(--paper-surface)] transition-all duration-200 hover:bg-[#4d6831] hover:shadow-md"
            >
              <Leaf size={16} className="mr-2" />
              Start your first observation
            </Button>
            {(status === "error" || denied || status === "ready") && (
              <Button
                variant="outline"
                onClick={refresh}
                className="h-11 border-[rgba(124,122,102,0.4)] text-[var(--ink-text)] transition-all duration-200 hover:bg-[rgba(91,123,58,0.08)]"
              >
                <RefreshCw size={15} className="mr-2" />
                {denied ? "Try location again" : "Refresh nearby"}
              </Button>
            )}
          </div>

          {/* Nearby starter suggestions */}
          <div className="mt-6">
            {locating ? (
              <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
                <Loader2 size={16} className="animate-spin text-[var(--moss-accent)]" />
                Loading nearby occurrences\u2026
              </div>
            ) : status === "error" ? (
              <p className="text-sm text-[var(--terracotta-accent)]">
                {error || "Could not load nearby species."}
              </p>
            ) : status === "ready" && species.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {species.slice(0, 14).map((s, i) => (
                  <motion.button
                    key={`${s.scientificName}-${i}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    onClick={() => onPickSpecies?.(s)}
                    className="group flex items-center gap-2 rounded-full border border-[rgba(124,122,102,0.3)] bg-[var(--paper-surface)] px-3 py-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--moss-accent)] hover:shadow-sm"
                  >
                    <MapPin
                      size={13}
                      className="shrink-0 text-[var(--terracotta-accent)] transition-transform group-hover:scale-110"
                    />
                    <span className="max-w-[160px] truncate text-[13px] italic text-[var(--ink-text)]">
                      {formatScientificName(s.scientificName)}
                    </span>
                    {s.count > 1 && (
                      <Badge className="h-4 border-0 bg-[rgba(91,123,58,0.15)] px-1.5 text-[10px] font-semibold text-[var(--moss-accent)]">
                        {s.count}
                      </Badge>
                    )}
                  </motion.button>
                ))}
              </div>
            ) : status === "ready" && species.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">
                No recent occurrences found nearby \u2014 search a species to begin.
              </p>
            ) : null}
            {position?.locationName && status === "ready" && (
              <p className="mt-3 text-xs text-[var(--ink-muted)]">
                Live GBIF occurrences near {titleCase(position.locationName)}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default EmptyObservationState;
