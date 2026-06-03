import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Leaf, MapPin, BookMarked } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IucnStatusNote } from "@/components/IucnStatusNote";
import { TaxonomyChain } from "@/components/TaxonomyChain";
import { RangeMap } from "@/components/RangeMap";
import {
  matchSpecies,
  getOccurrenceCount,
  getIucnStatus,
  getVernacularName,
} from "@/lib/gbif";
import { normalizeChain } from "@/lib/taxonomy";
import { formatCount } from "@/lib/format";
import type { TaxonomyChain as TChain } from "@/types";
import { cn } from "@/lib/utils";

interface ProofState {
  taxonKey: string | null;
  commonName: string;
  scientificName: string;
  chain: TChain;
  count: number | null;
  iucn: string | null;
}

const SCI = "Danaus plexippus";

export function ProofSpecimenCard({ className }: { className?: string }) {
  const [state, setState] = useState<ProofState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const match = await matchSpecies(SCI);
        const key = match?.usageKey ? String(match.usageKey) : null;
        const [count, iucn, vern] = await Promise.all([
          key ? getOccurrenceCount(key).catch(() => null) : Promise.resolve(null),
          getIucnStatus(SCI).catch(() => null),
          key ? getVernacularName(key).catch(() => null) : Promise.resolve(null),
        ]);
        if (!alive) return;
        setState({
          taxonKey: key,
          commonName: vern || "Monarch Butterfly",
          scientificName: match?.scientificName || SCI,
          chain: normalizeChain(match),
          count,
          iucn: iucn || "VU",
        });
      } catch (e: any) {
        if (alive) setError(e?.message || "Could not load live specimen.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      whileHover={{ rotate: 0, y: -4 }}
      className={cn("w-full max-w-sm", className)}
    >
      <Card className="paper-grain relative overflow-hidden rounded-[4px] border border-[rgba(124,122,102,0.4)] bg-[var(--paper-surface)] p-0 shadow-[0_18px_44px_-22px_rgba(44,51,36,0.5)]">
        {/* corner flourish */}
        <div className="pointer-events-none absolute right-3 top-3 z-10 opacity-40">
          <Leaf className="text-[var(--moss-accent)]" size={20} strokeWidth={1.25} />
        </div>

        {/* live badge */}
        <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-[rgba(91,123,58,0.4)] bg-[rgba(251,248,240,0.85)] px-2.5 py-1 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--moss-accent)] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--moss-accent)]" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Live GBIF
          </span>
        </div>

        <div className="px-5 pb-5 pt-12">
          {/* range map thumbnail */}
          <div className="mb-4 overflow-hidden rounded-[3px] border border-[rgba(124,122,102,0.3)]">
            {loading ? (
              <Skeleton className="h-36 w-full bg-[rgba(124,122,102,0.14)]" />
            ) : state?.taxonKey ? (
              <RangeMap taxonKey={state.taxonKey} thumbnail height={144} />
            ) : (
              <div className="flex h-36 w-full items-center justify-center bg-[var(--paper-bg)] text-xs text-[var(--ink-muted)]">
                Range unavailable
              </div>
            )}
          </div>

          {/* names */}
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-3/4 bg-[rgba(124,122,102,0.14)]" />
              <Skeleton className="h-4 w-1/2 bg-[rgba(124,122,102,0.12)]" />
            </div>
          ) : (
            <>
              <p className="font-serif text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                Specimen no. 001
              </p>
              <h3 className="font-display text-2xl font-semibold leading-tight text-[var(--ink-text)]">
                {state?.commonName}
              </h3>
              <p className="mt-0.5 font-serif text-base italic text-[var(--moss-accent)]">
                {state?.scientificName}
              </p>
            </>
          )}

          {/* taxonomy chain */}
          {!loading && state && (
            <div className="mt-3">
              <TaxonomyChain chain={state.chain} compact />
            </div>
          )}

          {/* margin notes */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-[rgba(124,122,102,0.35)] pt-3">
            {loading ? (
              <Skeleton className="h-5 w-40 bg-[rgba(124,122,102,0.12)]" />
            ) : (
              <>
                <span className="flex items-center gap-1.5 font-serif text-sm text-[var(--ink-text)]">
                  <BookMarked
                    className="text-[var(--terracotta-accent)]"
                    size={14}
                    strokeWidth={1.75}
                  />
                  <strong className="font-semibold">
                    {state?.count != null ? formatCount(state.count) : "—"}
                  </strong>
                  <span className="text-[var(--ink-muted)]">observations</span>
                </span>
                <IucnStatusNote status={state?.iucn} size="sm" />
              </>
            )}
          </div>

          {error && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--terracotta-accent)]">
              <MapPin size={12} strokeWidth={2} />
              {error}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default ProofSpecimenCard;
