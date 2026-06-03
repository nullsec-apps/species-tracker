import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookMarked,
  Loader2,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  Feather,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SpecimenCard } from "@/components/SpecimenCard";
import { EmptyObservationState } from "@/components/EmptyObservationState";
import type { Observation, TaxonomyFilter } from "@/types";
import type { NearbySpecies } from "@/hooks/useNearbyOccurrences";
import { cn } from "@/lib/utils";

interface ObservationLogProps {
  observations: Observation[];
  observerName?: string | null;
  status: "loading" | "ready" | "error" | "offline";
  error?: string | null;
  onReload?: () => void;
  onDelete?: (id: string) => Promise<void> | void;
  onRankClick?: (f: NonNullable<TaxonomyFilter>) => void;
  onStart?: () => void;
  onPickNearby?: (s: NearbySpecies) => void;
  className?: string;
}

export function ObservationLog({
  observations,
  observerName,
  status,
  error,
  onReload,
  onDelete,
  onRankClick,
  onStart,
  onPickNearby,
  className,
}: ObservationLogProps) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(pendingDelete);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <section className={cn("w-full", className)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-5 flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <BookMarked
              size={18}
              strokeWidth={1.75}
              className="text-[var(--terracotta-accent)]"
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {observerName ? `${observerName}’s field log` : "Your field log"}
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold leading-tight text-[var(--ink-text)] sm:text-3xl">
            Pressed specimens
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {status === "ready" && observations.length > 0 && (
            <Badge className="h-7 border-0 bg-[rgba(91,123,58,0.14)] px-3 text-xs font-semibold text-[var(--moss-accent)]">
              {observations.length} pressed
            </Badge>
          )}
          {onReload && status !== "offline" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReload}
              className="h-8 gap-1.5 px-2 text-xs text-[var(--ink-muted)] transition-all duration-200 hover:bg-[rgba(91,123,58,0.08)] hover:text-[var(--moss-accent)]"
            >
              <RefreshCw size={13} />
              Refresh
            </Button>
          )}
        </div>
      </motion.div>

      {status === "loading" ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-[5px] border border-[rgba(124,122,102,0.25)] bg-[var(--paper-surface)] p-4 sm:flex-row"
            >
              <Skeleton className="h-40 w-full bg-[rgba(124,122,102,0.12)] sm:h-32 sm:w-44" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-2/3 bg-[rgba(124,122,102,0.12)]" />
                <Skeleton className="h-4 w-1/2 bg-[rgba(124,122,102,0.1)]" />
                <Skeleton className="h-12 w-40 bg-[rgba(124,122,102,0.08)]" />
              </div>
            </div>
          ))}
        </div>
      ) : status === "error" ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[5px] border border-[rgba(192,97,43,0.35)] bg-[rgba(192,97,43,0.06)] px-6 py-12 text-center">
          <AlertTriangle size={24} className="text-[var(--terracotta-accent)]" />
          <p className="font-serif text-base italic text-[var(--ink-text)]">
            {error || "Couldn’t load your field log."}
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
        </div>
      ) : status === "offline" ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[5px] border border-dashed border-[rgba(124,122,102,0.4)] bg-[rgba(251,248,240,0.5)] px-6 py-12 text-center">
          <WifiOff
            size={22}
            strokeWidth={1.5}
            className="text-[var(--ink-muted)]"
          />
          <p className="font-serif text-base italic text-[var(--ink-text)]">
            Running locally — press a sighting to begin.
          </p>
          <Button
            onClick={onStart}
            className="h-10 gap-2 bg-[var(--moss-accent)] text-[var(--paper-surface)] transition-all duration-200 hover:bg-[#4d6831]"
          >
            <Feather size={15} />
            Log sighting
          </Button>
        </div>
      ) : observations.length === 0 ? (
        <EmptyObservationState onStart={onStart} onPickSpecies={onPickNearby} />
      ) : (
        <div className="space-y-4">
          {observations.map((o, i) => (
            <SpecimenCard
              key={o.id || `obs-${i}`}
              observation={o}
              index={i}
              onRankClick={onRankClick}
              onDelete={(id) => setPendingDelete(id)}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent className="paper-grain border border-[rgba(124,122,102,0.3)] bg-[var(--paper-surface)] text-[var(--ink-text)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-[var(--ink-text)]">
              Remove this specimen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--ink-muted)]">
              This will permanently remove the pressed observation from your
              field log. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[rgba(124,122,102,0.4)] text-[var(--ink-text)]">
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="gap-2 bg-[var(--terracotta-accent)] text-[var(--paper-surface)] hover:bg-[#a8511f]"
            >
              {deleting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default ObservationLog;
