import { motion } from "framer-motion";
import { X, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RANK_ORDER } from "@/lib/taxonomy";
import { normalizeChain } from "@/lib/taxonomy";
import type { SpeciesRecord, TaxonomyFilter } from "@/types";
import { cn } from "@/lib/utils";

interface TaxonomyFilterStripProps {
  species: SpeciesRecord[];
  filter: TaxonomyFilter;
  onFilter: (f: TaxonomyFilter) => void;
  className?: string;
}

const STRIP_RANKS = ["kingdom", "class", "order"] as const;

export function TaxonomyFilterStrip({
  species,
  filter,
  onFilter,
  className,
}: TaxonomyFilterStripProps) {
  const buckets: { rank: string; value: string; color: string; count: number }[] = [];
  const seen = new Set<string>();

  for (const rank of STRIP_RANKS) {
    const def = RANK_ORDER.find((r) => r.key === rank);
    if (!def) continue;
    const counts = new Map<string, number>();
    for (const s of species) {
      const chain = normalizeChain(s.taxonomy_chain || s);
      const v = chain[rank as keyof typeof chain];
      if (v) counts.set(v, (counts.get(v) || 0) + 1);
    }
    for (const [value, count] of counts) {
      const key = `${rank}:${value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      buckets.push({ rank, value, color: def.color, count });
    }
  }

  buckets.sort((a, b) => b.count - a.count);
  const top = buckets.slice(0, 24);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "w-full border-b border-[rgba(124,122,102,0.25)] bg-[var(--paper-surface)]",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <Layers
          className="shrink-0 text-[var(--moss-accent)]"
          size={15}
          strokeWidth={1.75}
        />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          Filter the field
        </span>
        {filter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onFilter(null)}
            className="ml-auto h-7 gap-1 px-2 text-[11px] text-[var(--terracotta-accent)] transition-all duration-200 hover:bg-[rgba(192,97,43,0.08)]"
          >
            <X size={12} strokeWidth={2} />
            Clear
          </Button>
        )}
      </div>

      {top.length === 0 ? (
        <div className="px-4 pb-3 text-xs text-[var(--ink-muted)]">
          No taxonomy yet — log a sighting to start your field index.
        </div>
      ) : (
        <div
          className="flex snap-x gap-2 overflow-x-auto px-4 pb-3"
          style={{ scrollbarWidth: "none" }}
        >
          {top.map((b, i) => {
            const active =
              filter?.rank === b.rank &&
              filter.value.toLowerCase() === b.value.toLowerCase();
            return (
              <motion.button
                key={`${b.rank}:${b.value}`}
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
                onClick={() =>
                  active ? onFilter(null) : onFilter({ rank: b.rank, value: b.value })
                }
                className={cn(
                  "group flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-left transition-all duration-200",
                  active
                    ? "border-transparent text-[var(--paper-surface)] shadow-sm"
                    : "border-[rgba(124,122,102,0.3)] bg-[var(--paper-bg)] text-[var(--ink-text)] hover:-translate-y-0.5 hover:border-[var(--moss-accent)] hover:shadow-sm"
                )}
                style={active ? { backgroundColor: b.color } : undefined}
              >
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full transition-transform group-hover:scale-125"
                  style={{ backgroundColor: active ? "rgba(251,248,240,0.9)" : b.color }}
                />
                <span className="max-w-[120px] truncate text-xs font-medium">
                  {b.value}
                </span>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    active ? "text-[rgba(251,248,240,0.75)]" : "text-[var(--ink-muted)]"
                  )}
                >
                  {b.count}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default TaxonomyFilterStrip;
