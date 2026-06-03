import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { chainToOrderedEntries } from "@/lib/taxonomy";
import type { TaxonomyChain as TChain, TaxonomyFilter } from "@/types";
import { cn } from "@/lib/utils";

interface TaxonomyChainProps {
  chain: TChain | null | undefined;
  compact?: boolean;
  onRankClick?: (filter: NonNullable<TaxonomyFilter>) => void;
  className?: string;
}

export function TaxonomyChain({
  chain,
  compact = false,
  onRankClick,
  className,
}: TaxonomyChainProps) {
  const navigate = useNavigate();
  const entries = chainToOrderedEntries(chain);
  const [expanded, setExpanded] = useState(!compact);

  if (!entries.length) {
    return (
      <p className={cn("text-xs italic text-[var(--ink-muted)]", className)}>
        Taxonomy unavailable.
      </p>
    );
  }

  function handleClick(rank: string, value: string) {
    if (onRankClick) {
      onRankClick({ rank, value });
    } else {
      navigate(`/?rank=${rank}&value=${encodeURIComponent(value)}`);
    }
  }

  const visible = compact && !expanded ? entries.slice(0, 3) : entries;
  const hidden = entries.length - visible.length;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
        <AnimatePresence initial={false}>
          {visible.map((entry, i) => (
            <motion.span
              key={entry.rank}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.22, delay: i * 0.03 }}
              className="flex items-center gap-1"
            >
              <button
                type="button"
                onClick={() => handleClick(entry.rank, entry.value)}
                title={`${entry.label}: ${entry.value} — filter feed`}
                className="group inline-flex items-center gap-1.5 rounded-full border bg-[var(--paper-surface)] px-2 py-0.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                style={{
                  borderColor: `${entry.color}55`,
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125"
                  style={{ backgroundColor: entry.color }}
                />
                <span
                  className={cn(
                    "font-serif italic leading-none text-[var(--ink-text)]",
                    compact ? "text-[11px]" : "text-xs"
                  )}
                >
                  {entry.value}
                </span>
                {!compact && (
                  <span className="text-[9px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                    {entry.label.slice(0, 1)}
                  </span>
                )}
              </button>
              {i < visible.length - 1 && (
                <ChevronRight
                  className="text-[var(--ink-muted)] opacity-50"
                  size={compact ? 11 : 13}
                  strokeWidth={1.75}
                />
              )}
            </motion.span>
          ))}
        </AnimatePresence>

        {compact && hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-1 inline-flex items-center gap-1 rounded-full border border-dashed border-[rgba(124,122,102,0.45)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-muted)] transition-colors duration-200 hover:border-[var(--moss-accent)] hover:text-[var(--moss-accent)]"
          >
            <ChevronsUpDown size={10} strokeWidth={2} />
            unfold {hidden} more
          </button>
        )}

        {compact && expanded && entries.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-[var(--ink-muted)] transition-colors duration-200 hover:text-[var(--ink-text)]"
          >
            fold
          </button>
        )}
      </div>
    </div>
  );
}

export default TaxonomyChain;
