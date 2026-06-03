import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Menu, BookMarked, Compass, Sprout } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SpeciesSearch } from "@/components/SpeciesSearch";
import { TaxonomyRail } from "@/components/TaxonomyRail";
import { TaxonomyFilterStrip } from "@/components/TaxonomyFilterStrip";
import type { SpeciesRecord, TaxonomyFilter } from "@/types";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  species: SpeciesRecord[];
  filter: TaxonomyFilter;
  onFilter: (f: TaxonomyFilter) => void;
  count?: number;
  observerName?: string | null;
  showRail?: boolean;
}

const NAV = [
  { to: "/", label: "Field guide", icon: Compass },
  { to: "/log", label: "My log", icon: BookMarked },
];

export function AppShell({
  children,
  species,
  filter,
  onFilter,
  count,
  observerName,
  showRail = true,
}: AppShellProps) {
  const location = useLocation();
  const [railOpen, setRailOpen] = useState(false);
  const logoUrl =
    typeof window !== "undefined"
      ? (window as any).__NULLSEC__?.logoUrl
      : undefined;

  const handleFilter = (f: TaxonomyFilter) => {
    onFilter(f);
    setRailOpen(false);
  };

  return (
    <div className="paper-grain min-h-screen w-full overflow-x-hidden bg-[var(--paper-bg)] text-[var(--ink-text)]">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-[rgba(124,122,102,0.3)] bg-[rgba(244,240,230,0.86)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          {/* mobile rail toggle */}
          {showRail && (
            <Sheet open={railOpen} onOpenChange={setRailOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 text-[var(--ink-text)] transition-colors hover:bg-[rgba(91,123,58,0.08)] lg:hidden"
                  aria-label="Open taxonomy"
                >
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="paper-grain w-[300px] border-r border-[rgba(124,122,102,0.3)] bg-[var(--paper-surface)] p-5"
              >
                <TaxonomyRail
                  species={species}
                  filter={filter}
                  onFilter={handleFilter}
                  count={count}
                />
              </SheetContent>
            </Sheet>
          )}

          <Link to="/" className="flex shrink-0 items-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Species"
                className="h-7 w-7"
                style={{ filter: "brightness(0) saturate(100%)" }}
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--moss-accent)]">
                <Leaf size={17} className="text-[var(--paper-surface)]" />
              </span>
            )}
            <span className="font-display text-xl font-semibold tracking-tight text-[var(--ink-text)]">
              Species
            </span>
          </Link>

          <div className="mx-2 hidden min-w-0 max-w-md flex-1 sm:block">
            <SpeciesSearch />
          </div>

          <nav className="ml-auto flex items-center gap-1">
            {NAV.map((n) => {
              const active =
                n.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-[rgba(91,123,58,0.14)] text-[var(--moss-accent)]"
                      : "text-[var(--ink-muted)] hover:bg-[rgba(124,122,102,0.08)] hover:text-[var(--ink-text)]"
                  )}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  <span className="hidden sm:inline">{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* mobile search row */}
        <div className="px-4 pb-3 sm:hidden">
          <SpeciesSearch />
        </div>

        {/* mobile taxonomy filter strip */}
        {showRail && (
          <div className="lg:hidden">
            <TaxonomyFilterStrip
              species={species}
              filter={filter}
              onFilter={onFilter}
            />
          </div>
        )}
      </header>

      {/* body */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {showRail ? (
          <div className="flex gap-8">
            {/* sticky rail (desktop) */}
            <aside className="hidden w-[260px] shrink-0 lg:block">
              <div className="sticky top-24">
                <div className="rounded-[6px] border border-[rgba(124,122,102,0.25)] bg-[var(--paper-surface)] p-4">
                  <TaxonomyRail
                    species={species}
                    filter={filter}
                    onFilter={onFilter}
                    count={count}
                    className="max-h-[calc(100vh-9rem)]"
                  />
                </div>
                <div className="mt-4 flex items-center gap-2 px-1 text-[11px] text-[var(--ink-muted)]">
                  <Sprout size={13} className="text-[var(--moss-accent)]" />
                  Backed by GBIF · iNaturalist · IUCN
                </div>
              </div>
            </aside>

            <main className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname + (filter?.value || "")}
                  initial={{ opacity: 0, filter: "blur(3px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(3px)" }}
                  transition={{ duration: 0.3 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        ) : (
          <main className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(3px)" }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        )}
      </div>

      <Separator className="bg-[rgba(124,122,102,0.2)]" />
      <footer className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <p className="font-serif text-sm italic text-[var(--ink-muted)]">
          Every sighting tells the story of a place.
        </p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Occurrence & taxonomy data from GBIF · conservation status from the
          IUCN Red List.
        </p>
      </footer>
    </div>
  );
}

export default AppShell;
