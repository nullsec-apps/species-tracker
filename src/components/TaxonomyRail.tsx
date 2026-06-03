import { motion } from "framer-motion";
import { Sprout, X, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RANK_ORDER, normalizeChain, rankLabel } from "@/lib/taxonomy";
import type { SpeciesRecord, TaxonomyFilter } from "@/types";
import { cn } from "@/lib/utils";

interface TaxonomyRailProps {
  species: SpeciesRecord[];
  filter: TaxonomyFilter;
  onFilter: (f: TaxonomyFilter) => void;
  count?: number;
  className?: string;
}

const RAIL_RANKS = ["kingdom", "phylum", "class", "order"] as const;

function bucketsForRank(species: SpeciesRecord[], rank: string) {
  const counts = new Map<string, number>();
  for (const s of species) {
    const chain = normalizeChain(s.taxonomy_chain || s);
    const v = chain[rank as keyof typeof chain];
    if (v) counts.set(v, (counts.get(v) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export function TaxonomyRail({
  species,
  filter,
  onFilter,
  count,
  className,
}: TaxonomyRailProps) {
  const populated = RAIL_RANKS.filter((r) => bucketsForRank(species, r).length > 0);
  const defaultOpen = filter
    ? [filter.rank]
    : populated.length
    ? [populated[0]]
    : [];

  return (
    <aside
      className={cn(
        "flex w-full flex-col",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(91,123,58,0.12)]">
            <Sprout className="text-[var(--moss-accent)]" size={16} strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-display text-sm font-semibold leading-none text-[var(--ink-text)]">
              Taxonomy
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              {count != null ? `${count} pressed` : "Field index"}
            </p>
          </div>
        </div>
        {filter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onFilter(null)}
            className="h-7 gap-1 px-2 text-[11px] text-[var(--terracotta-accent)] transition-all duration-200 hover:bg-[rgba(192,97,43,0.08)]"
          >
            <X size={12} strokeWidth={2} />
            Clear
          </Button>
        )}
      </div>

      <Separator className="bg-[rgba(124,122,102,0.25)]" />

      {populated.length === 0 ? (
        <div className="px-1 py-6 text-center">
          <p className="font-serif text-sm italic text-[var(--ink-muted)]">
            No species pressed yet.
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Log a sighting and the taxonomy tree will unfold here.
          </p>
        </div>
      ) : (
        <ScrollArea className="mt-2 flex-1 pr-2">
          <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
            {populated.map((rank) => {
              const def = RANK_ORDER.find((r) => r.key === rank);
              const buckets = bucketsForRank(species, rank);
              return (
                <AccordionItem
                  key={rank}
                  value={rank}
                  className="border-b border-dashed border-[rgba(124,122,102,0.3)]"
                >
                  <AccordionTrigger className="group py-2.5 text-left hover:no-underline [&>svg]:hidden">
                    <span className="flex w-full items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: def?.color }}
                      />
                      <span className="font-serif text-[13px] font-medium text-[var(--ink-text)]">
                        {rankLabel(rank)}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-auto h-5 border-[rgba(124,122,102,0.3)] px-1.5 text-[10px] font-normal tabular-nums text-[var(--ink-muted)]"
                      >
                        {buckets.length}
                      </Badge>
                      <ChevronDown
                        size={14}
                        strokeWidth={2}
                        className="text-[var(--ink-muted)] transition-transform duration-200 group-data-[state=open]:rotate-180"
                      />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="flex flex-col gap-0.5">
                      {buckets.map((b, i) => {
                        const active =
                          filter?.rank === rank &&
                          filter.value.toLowerCase() === b.value.toLowerCase();
                        return (
                          <motion.button
                            key={b.value}
                            type="button"
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                            onClick={() =>
                              active
                                ? onFilter(null)
                                : onFilter({ rank, value: b.value })
                            }
                            className={cn(
                              "flex items-center gap-2 rounded-[3px] px-2 py-1.5 text-left transition-all duration-200",
                              active
                                ? "bg-[rgba(91,123,58,0.12)]"
                                : "hover:bg-[rgba(124,122,102,0.08)]"
                            )}
                          >
                            <span
                              className="truncate text-[13px]"
                              style={{
                                color: active ? def?.color : "var(--ink-text)",
                                fontWeight: active ? 600 : 400,
                              }}
                            >
                              {b.value}
                            </span>
                            <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--ink-muted)]">
                              {b.count}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
      )}
    </aside>
  );
}

export default TaxonomyRail;
