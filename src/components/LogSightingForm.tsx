import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Loader2,
  MapPin,
  Search,
  X,
  CalendarDays,
  Check,
  AlertTriangle,
  Locate,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PhotoUploader } from "@/components/PhotoUploader";
import { IucnStatusNote } from "@/components/IucnStatusNote";
import { useSpeciesSearch } from "@/hooks/useSpeciesSearch";
import { getSpeciesByKey, getIucnStatus, buildTaxonomyChain } from "@/lib/gbif";
import { getCurrentPosition, reverseGeocode } from "@/lib/geo";
import { normalizeChain, chainSummary } from "@/lib/taxonomy";
import { titleCase } from "@/lib/format";
import type { Observation, TaxonomyChain } from "@/types";
import { cn } from "@/lib/utils";

interface LogSightingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  observerName?: string | null;
  onCreate: (obs: Observation) => Promise<Observation | null>;
  prefill?: Partial<Observation> | null;
}

interface PickedSpecies {
  scientific_name: string;
  common_name?: string | null;
  gbif_taxon_key?: string | null;
  taxonomy?: TaxonomyChain | null;
  iucn_status?: string | null;
}

export function LogSightingForm({
  open,
  onOpenChange,
  observerName,
  onCreate,
  prefill,
}: LogSightingFormProps) {
  const search = useSpeciesSearch();
  const [picked, setPicked] = useState<PickedSpecies | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  const [observedAt, setObservedAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    search.clear();
    setPicked(null);
    setShowResults(false);
    setLocationName("");
    setLat(null);
    setLng(null);
    setObservedAt(new Date().toISOString().slice(0, 10));
    setNotes("");
    setPhotoUrl(null);
    setError(null);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    if (prefill) {
      if (prefill.scientific_name) {
        setPicked({
          scientific_name: prefill.scientific_name,
          common_name: prefill.common_name ?? null,
          gbif_taxon_key: prefill.gbif_taxon_key ?? null,
          taxonomy: prefill.taxonomy ?? null,
          iucn_status: prefill.iucn_status ?? null,
        });
      }
      if (prefill.location_name) setLocationName(prefill.location_name);
      if (prefill.latitude != null) setLat(prefill.latitude);
      if (prefill.longitude != null) setLng(prefill.longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handlePick = useCallback(
    async (key: string, sciName: string, commonName?: string | null) => {
      setShowResults(false);
      search.clear();
      setPicked({ scientific_name: sciName, common_name: commonName });
      setEnriching(true);
      try {
        const [detail, iucn] = await Promise.all([
          getSpeciesByKey(key).catch(() => null),
          getIucnStatus(sciName).catch(() => null),
        ]);
        const chain = detail
          ? buildTaxonomyChain(detail)
          : null;
        setPicked({
          scientific_name: detail?.scientificName || sciName,
          common_name: commonName ?? detail?.vernacularName ?? null,
          gbif_taxon_key: key,
          taxonomy: chain ? normalizeChain(chain) : null,
          iucn_status: iucn,
        });
      } catch {
        /* keep basic pick */
      } finally {
        setEnriching(false);
      }
    },
    [search]
  );

  const useMyLocation = useCallback(async () => {
    setLocating(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setLat(pos.latitude);
      setLng(pos.longitude);
      const name = await reverseGeocode(pos.latitude, pos.longitude).catch(
        () => null
      );
      if (name) setLocationName(name);
    } catch (e: any) {
      setError(e?.message || "Could not get your location.");
    } finally {
      setLocating(false);
    }
  }, []);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!picked?.scientific_name) {
        setError("Choose a species first.");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const obs: Observation = {
          observer_name: observerName ?? null,
          scientific_name: picked.scientific_name,
          common_name: picked.common_name ?? null,
          gbif_taxon_key: picked.gbif_taxon_key ?? null,
          taxonomy: picked.taxonomy ?? null,
          iucn_status: picked.iucn_status ?? null,
          latitude: lat,
          longitude: lng,
          location_name: locationName.trim() || null,
          observed_at: observedAt
            ? new Date(observedAt).toISOString()
            : new Date().toISOString(),
          notes: notes.trim() || null,
          photo_url: photoUrl,
          verification_status: "unverified",
        };
        const created = await onCreate(obs);
        if (created) {
          reset();
          onOpenChange(false);
        } else {
          setError("Could not save your observation. Try again.");
        }
      } catch (err: any) {
        setError(err?.message || "Could not save your observation.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      picked,
      observerName,
      lat,
      lng,
      locationName,
      observedAt,
      notes,
      photoUrl,
      onCreate,
      reset,
      onOpenChange,
    ]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="paper-grain max-h-[92vh] max-w-lg overflow-y-auto border border-[rgba(124,122,102,0.3)] bg-[var(--paper-surface)] text-[var(--ink-text)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-semibold text-[var(--ink-text)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(91,123,58,0.12)]">
              <Leaf className="text-[var(--moss-accent)]" size={17} strokeWidth={1.75} />
            </span>
            Press a new specimen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="mt-1 space-y-5">
          {/* species search */}
          <div ref={searchRef} className="relative">
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Species
            </Label>
            {picked ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-[4px] border border-[rgba(91,123,58,0.4)] bg-[rgba(91,123,58,0.06)] p-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    setPicked(null);
                    search.clear();
                  }}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors duration-200 hover:bg-[rgba(124,122,102,0.12)] hover:text-[var(--terracotta-accent)]"
                  aria-label="Clear species"
                >
                  <X size={13} strokeWidth={2} />
                </button>
                <p className="font-display text-base font-semibold leading-tight text-[var(--ink-text)]">
                  {picked.common_name
                    ? titleCase(picked.common_name)
                    : picked.scientific_name}
                </p>
                <p className="font-serif text-sm italic text-[var(--moss-accent)]">
                  {picked.scientific_name}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {enriching ? (
                    <span className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                      <Loader2 size={12} className="animate-spin" strokeWidth={2} />
                      Enriching from GBIF…
                    </span>
                  ) : (
                    <>
                      {picked.taxonomy && chainSummary(picked.taxonomy) && (
                        <span className="text-[11px] text-[var(--ink-muted)]">
                          {chainSummary(picked.taxonomy)}
                        </span>
                      )}
                      {picked.iucn_status && (
                        <IucnStatusNote status={picked.iucn_status} size="sm" />
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <>
                <div className="relative">
                  <Search
                    size={16}
                    strokeWidth={1.75}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
                  />
                  <Input
                    value={search.query}
                    onChange={(e) => {
                      search.setQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search GBIF — e.g. Monarch, Quercus…"
                    className="h-12 border-[rgba(124,122,102,0.4)] bg-[var(--paper-bg)] pl-10 pr-9 text-base text-[var(--ink-text)] transition-all duration-200 placeholder:text-[var(--ink-muted)] focus-visible:border-[var(--moss-accent)] focus-visible:ring-2 focus-visible:ring-[rgba(91,123,58,0.2)]"
                  />
                  {search.isSearching && (
                    <Loader2
                      size={15}
                      strokeWidth={2}
                      className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--moss-accent)]"
                    />
                  )}
                </div>

                <AnimatePresence>
                  {showResults && (search.hasResults || search.error) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto rounded-[6px] border border-[rgba(124,122,102,0.35)] bg-[var(--paper-surface)] shadow-[0_18px_40px_-20px_rgba(44,51,36,0.5)]"
                    >
                      {search.error ? (
                        <div className="flex items-center gap-2 px-3 py-3 text-xs text-[var(--terracotta-accent)]">
                          <AlertTriangle size={14} strokeWidth={2} />
                          {search.error}
                        </div>
                      ) : (
                        search.results.map((r) => (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() =>
                              handlePick(r.key, r.scientificName, r.commonName)
                            }
                            className="flex w-full items-start gap-2.5 border-b border-[rgba(124,122,102,0.15)] px-3 py-2.5 text-left transition-colors duration-150 last:border-0 hover:bg-[rgba(91,123,58,0.07)]"
                          >
                            <Leaf
                              size={14}
                              strokeWidth={1.75}
                              className="mt-0.5 shrink-0 text-[var(--moss-accent)]"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-serif text-sm italic text-[var(--ink-text)]">
                                {r.scientificName}
                              </p>
                              {r.commonName && (
                                <p className="truncate text-xs text-[var(--ink-muted)]">
                                  {titleCase(r.commonName)}
                                </p>
                              )}
                            </div>
                            {r.rank && (
                              <Badge
                                variant="outline"
                                className="ml-auto shrink-0 border-[rgba(124,122,102,0.3)] text-[10px] capitalize text-[var(--ink-muted)]"
                              >
                                {r.rank.toLowerCase()}
                              </Badge>
                            )}
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* photo */}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Specimen photo
            </Label>
            <PhotoUploader onUploaded={setPhotoUrl} />
          </div>

          {/* location */}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Location
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <MapPin
                  size={15}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
                />
                <Input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Where did you spot it?"
                  className="h-12 border-[rgba(124,122,102,0.4)] bg-[var(--paper-bg)] pl-9 text-base text-[var(--ink-text)] focus-visible:border-[var(--moss-accent)] focus-visible:ring-2 focus-visible:ring-[rgba(91,123,58,0.2)]"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={useMyLocation}
                disabled={locating}
                className="h-12 shrink-0 gap-1.5 border-[rgba(124,122,102,0.4)] text-sm text-[var(--ink-text)] transition-all duration-200 hover:bg-[rgba(91,123,58,0.07)]"
              >
                {locating ? (
                  <Loader2 size={15} className="animate-spin" strokeWidth={2} />
                ) : (
                  <Locate size={15} strokeWidth={1.75} />
                )}
                Locate
              </Button>
            </div>
            {lat != null && lng != null && (
              <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">
                Stamped at {lat.toFixed(3)}, {lng.toFixed(3)}
              </p>
            )}
          </div>

          {/* date */}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Observed on
            </Label>
            <div className="relative">
              <CalendarDays
                size={15}
                strokeWidth={1.75}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
              />
              <Input
                type="date"
                value={observedAt}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setObservedAt(e.target.value)}
                className="h-12 border-[rgba(124,122,102,0.4)] bg-[var(--paper-bg)] pl-9 text-base text-[var(--ink-text)] focus-visible:border-[var(--moss-accent)] focus-visible:ring-2 focus-visible:ring-[rgba(91,123,58,0.2)]"
              />
            </div>
          </div>

          {/* notes */}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Field notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Behaviour, habitat, weather, companions…"
              rows={3}
              className="resize-none border-[rgba(124,122,102,0.4)] bg-[var(--paper-bg)] text-base text-[var(--ink-text)] focus-visible:border-[var(--moss-accent)] focus-visible:ring-2 focus-visible:ring-[rgba(91,123,58,0.2)]"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-[3px] border border-[rgba(192,97,43,0.35)] bg-[rgba(192,97,43,0.08)] px-3 py-2"
            >
              <AlertTriangle
                size={14}
                strokeWidth={2}
                className="mt-0.5 shrink-0 text-[var(--terracotta-accent)]"
              />
              <p className="text-xs text-[var(--terracotta-accent)]">{error}</p>
            </motion.div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 flex-1 border-[rgba(124,122,102,0.4)] text-base text-[var(--ink-text)] transition-all duration-200 hover:bg-[rgba(124,122,102,0.08)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !picked}
              className="h-12 flex-1 gap-2 bg-[var(--moss-accent)] text-base text-[var(--paper-surface)] shadow-sm transition-all duration-200 hover:bg-[#4d6831] hover:shadow-md disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" strokeWidth={2} />
              ) : (
                <Check size={16} strokeWidth={2} />
              )}
              Press specimen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default LogSightingForm;
