import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, MapPin, Sprout, MoreVertical, Trash2, ImageOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CollectionTag } from "@/components/CollectionTag";
import { TaxonomyChain } from "@/components/TaxonomyChain";
import { IucnStatusNote } from "@/components/IucnStatusNote";
import { normalizeChain } from "@/lib/taxonomy";
import { titleCase, formatCount } from "@/lib/format";
import type { Observation, SpeciesRecord, TaxonomyFilter } from "@/types";
import { cn } from "@/lib/utils";

type CardKind = "observation" | "species";

interface SpecimenCardProps {
  observation?: Observation;
  species?: SpeciesRecord;
  index?: number;
  onRankClick?: (f: NonNullable<TaxonomyFilter>) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

function Flourish({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("pointer-events-none absolute", className)}
      fill="none"
      aria-hidden
    >
      <path
        d="M4 60 C4 30 14 14 36 8 M36 8 C28 12 24 18 24 24 M36 8 C40 14 44 16 52 16"
        stroke="var(--moss-accent)"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="36" cy="8" r="2" fill="var(--terracotta-accent)" opacity="0.6" />
    </svg>
  );
}

export function SpecimenCard({
  observation,
  species,
  index = 0,
  onRankClick,
  onDelete,
  className,
}: SpecimenCardProps) {
  const navigate = useNavigate();
  const kind: CardKind = observation ? "observation" : "species";

  const sci = observation?.scientific_name || species?.scientific_name || "";
  const common = observation?.common_name || species?.common_name || null;
  const photo = observation?.photo_url || species?.thumbnail_url || null;
  const iucn = observation?.iucn_status || species?.iucn_status || null;
  const taxonKey =
    observation?.gbif_taxon_key || species?.gbif_taxon_key || null;
  const occurrenceCount = species?.occurrence_count ?? null;

  const chain = useMemo(
    () =>
      normalizeChain(
        observation?.taxonomy ||
          species?.taxonomy_chain ||
          species ||
          {}
      ),
    [observation, species]
  );

  const id = observation?.id || species?.id;

  const goDetail = () => {
    if (taxonKey) navigate(`/species/${taxonKey}`);
    else if (sci) navigate(`/species/name/${encodeURIComponent(sci)}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-[5px] border border-[rgba(124,122,102,0.35)] bg-[var(--paper-surface)] shadow-[0_1px_3px_rgba(44,51,36,0.08)] transition-shadow duration-300 hover:shadow-[0_18px_38px_-18px_rgba(44,51,36,0.4)]",
        className
      )}
    >
      <Flourish className="-bottom-1 -left-1 h-14 w-14 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex flex-col sm:flex-row">
        {/* photo / pressed specimen */}
        <button
          type="button"
          onClick={goDetail}
          className="relative h-44 w-full shrink-0 overflow-hidden border-b border-[rgba(124,122,102,0.25)] bg-[var(--paper-bg)] sm:h-auto sm:w-44 sm:border-b-0 sm:border-r"
          aria-label={`Open ${sci}`}
        >
          {photo ? (
            <img
              src={photo}
              alt={sci}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[var(--ink-muted)]">
              <ImageOff size={22} strokeWidth={1.5} />
              <span className="text-[11px]">No specimen photo</span>
            </div>
          )}
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[rgba(251,248,240,0.92)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] shadow-sm backdrop-blur-sm">
            {kind === "observation" ? (
              <>
                <Sprout size={11} className="text-[var(--terracotta-accent)]" />
                Pressed
              </>
            ) : (
              <>
                <Leaf size={11} className="text-[var(--moss-accent)]" />
                Field guide
              </>
            )}
          </span>
        </button>

        {/* body */}
        <div className="relative min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={goDetail}
              className="min-w-0 flex-1 text-left"
            >
              <h3 className="truncate font-display text-lg font-semibold leading-tight text-[var(--ink-text)] transition-colors duration-200 group-hover:text-[var(--moss-accent)] sm:text-xl">
                {common ? titleCase(common) : sci}
              </h3>
              <p className="truncate font-serif text-sm italic text-[var(--moss-accent)]">
                {sci}
              </p>
            </button>

            {kind === "observation" && onDelete && id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors duration-200 hover:bg-[rgba(124,122,102,0.1)] hover:text-[var(--ink-text)]"
                    aria-label="Specimen actions"
                  >
                    <MoreVertical size={16} strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border border-[rgba(124,122,102,0.3)] bg-[var(--paper-surface)]"
                >
                  <DropdownMenuItem
                    onClick={() => onDelete(id)}
                    className="gap-2 text-[var(--terracotta-accent)] focus:bg-[rgba(192,97,43,0.08)] focus:text-[var(--terracotta-accent)]"
                  >
                    <Trash2 size={14} />
                    Remove specimen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mt-3">
            <TaxonomyChain chain={chain} compact onRankClick={onRankClick} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {iucn && <IucnStatusNote status={iucn} size="sm" />}
            {occurrenceCount != null && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                <MapPin size={12} className="text-[var(--moss-accent)]" />
                {formatCount(occurrenceCount)} records
              </span>
            )}
          </div>

          {kind === "observation" &&
            (observation?.observed_at ||
              observation?.location_name ||
              observation?.observer_name) && (
              <div className="mt-4">
                <CollectionTag
                  observedAt={observation?.observed_at}
                  locationName={observation?.location_name}
                  observerName={observation?.observer_name}
                />
              </div>
            )}

          {kind === "observation" && observation?.notes && (
            <p className="mt-3 line-clamp-2 font-serif text-[13px] italic leading-relaxed text-[var(--ink-muted)]">
              “{observation.notes}”
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default SpecimenCard;
