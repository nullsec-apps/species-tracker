import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Loader2, X, Leaf, CornerDownLeft, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSpeciesSearch } from "@/hooks/useSpeciesSearch";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SpeciesSearchProps {
  className?: string;
  placeholder?: string;
  onSelect?: (key: string, name: string) => void;
  autoNavigate?: boolean;
}

export function SpeciesSearch({
  className,
  placeholder = "Search any species — monarch, oak, kestrel…",
  onSelect,
  autoNavigate = true,
}: SpeciesSearchProps) {
  const { query, setQuery, results, status, error, clear, isSearching, hasResults } =
    useSpeciesSearch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [results]);

  function pick(key: string, name: string) {
    setOpen(false);
    clear();
    if (onSelect) onSelect(key, name);
    if (autoNavigate) navigate(`/species/${key}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || !hasResults) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) pick(r.key, r.scientificName);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
          size={17}
          strokeWidth={1.75}
        />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="h-12 rounded-full border-[rgba(124,122,102,0.4)] bg-[var(--paper-surface)] pl-11 pr-10 text-base text-[var(--ink-text)] shadow-sm transition-all duration-200 placeholder:text-[var(--ink-muted)] focus-visible:border-[var(--moss-accent)] focus-visible:ring-2 focus-visible:ring-[rgba(91,123,58,0.2)]"
        />
        {isSearching ? (
          <Loader2
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-[var(--moss-accent)]"
            size={16}
          />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              clear();
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors duration-200 hover:bg-[rgba(124,122,102,0.12)] hover:text-[var(--ink-text)]"
            aria-label="Clear search"
          >
            <X size={14} strokeWidth={2} />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {open && (query.trim().length >= 2 || hasResults || status === "error") && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.18 }}
            className="paper-grain absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[6px] border border-[rgba(124,122,102,0.35)] bg-[var(--paper-surface)] shadow-[0_22px_48px_-24px_rgba(44,51,36,0.55)]"
          >
            {status === "error" ? (
              <div className="flex items-center gap-2 px-4 py-3.5">
                <AlertTriangle
                  className="text-[var(--terracotta-accent)]"
                  size={15}
                  strokeWidth={2}
                />
                <span className="text-sm text-[var(--ink-muted)]">
                  {error || "Search failed. Try again."}
                </span>
              </div>
            ) : isSearching && !hasResults ? (
              <div className="flex items-center gap-2 px-4 py-3.5">
                <Loader2
                  className="animate-spin text-[var(--moss-accent)]"
                  size={15}
                />
                <span className="text-sm text-[var(--ink-muted)]">
                  Searching the field guide…
                </span>
              </div>
            ) : !hasResults ? (
              <div className="px-4 py-3.5 text-sm text-[var(--ink-muted)]">
                No species found for “{query.trim()}”.
              </div>
            ) : (
              <ul className="max-h-[340px] overflow-y-auto py-1">
                {results.map((r, i) => (
                  <li key={r.key}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(r.key, r.scientificName)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors duration-150",
                        i === active
                          ? "bg-[rgba(91,123,58,0.1)]"
                          : "hover:bg-[rgba(124,122,102,0.07)]"
                      )}
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(91,123,58,0.12)]">
                        <Leaf
                          className="text-[var(--moss-accent)]"
                          size={14}
                          strokeWidth={1.75}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[15px] italic text-[var(--ink-text)]">
                          {r.scientificName}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {r.commonName && (
                            <span className="truncate text-xs text-[var(--ink-muted)]">
                              {titleCase(r.commonName)}
                            </span>
                          )}
                          {r.rank && (
                            <Badge className="h-4 rounded-sm border-0 bg-[rgba(124,122,102,0.14)] px-1.5 text-[9px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                              {r.rank}
                            </Badge>
                          )}
                          {r.class && (
                            <span className="text-[10px] text-[var(--ink-muted)]">
                              {titleCase(r.class)}
                            </span>
                          )}
                        </span>
                      </span>
                      {i === active && (
                        <CornerDownLeft
                          className="mt-1 shrink-0 text-[var(--ink-muted)]"
                          size={13}
                          strokeWidth={1.75}
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SpeciesSearch;
