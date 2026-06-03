import { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Sprout } from "lucide-react";
import { Hero } from "@/components/Hero";
import { SpecimenFeed } from "@/components/SpecimenFeed";
import { NearbyOccurrences } from "@/components/NearbyOccurrences";
import { LogSightingForm } from "@/components/LogSightingForm";
import { LogSightingFab } from "@/components/LogSightingFab";
import { useObservations } from "@/hooks/useObservations";
import { useSpecies } from "@/hooks/useSpecies";
import { useNearbyOccurrences, type NearbySpecies } from "@/hooks/useNearbyOccurrences";
import { useObserverIdentity } from "@/hooks/useObserverIdentity";
import type { Observation } from "@/types";

interface HomePageProps {
  species: ReturnType<typeof useSpecies>;
  observations: ReturnType<typeof useObservations>;
}

export function HomePage({ species, observations }: HomePageProps) {
  const { name } = useObserverIdentity();
  const nearby = useNearbyOccurrences(5, 7);
  const [formOpen, setFormOpen] = useState(false);
  const [prefill, setPrefill] = useState<Partial<Observation> | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const openForm = useCallback((p?: Partial<Observation> | null) => {
    setPrefill(p ?? null);
    setFormOpen(true);
  }, []);

  const pickNearby = useCallback(
    (s: NearbySpecies) => {
      openForm({
        scientific_name: s.scientific_name,
        common_name: s.common_name ?? null,
        location_name: nearby.locationName ?? null,
        latitude: nearby.position?.latitude ?? null,
        longitude: nearby.position?.longitude ?? null,
      });
    },
    [openForm, nearby.locationName, nearby.position]
  );

  const scrollToFeed = useCallback(() => {
    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleCreate = useCallback(
    async (obs: Observation) => {
      const created = await observations.createObservation(obs);
      if (created && obs.scientific_name) {
        void species.enrichByName(obs.scientific_name);
      }
      return created;
    },
    [observations, species]
  );

  const totalCount = useMemo(
    () => observations.observations.length,
    [observations.observations.length]
  );

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 sm:-mt-8">
      <Hero onStart={() => openForm(null)} onExplore={scrollToFeed} />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <NearbyOccurrences
            status={nearby.status}
            species={nearby.species}
            locationName={nearby.locationName}
            error={nearby.error}
            onRetry={nearby.retry}
            onPick={pickNearby}
          />
        </motion.div>

        <div ref={feedRef} className="mt-10 scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Sprout
                  size={18}
                  strokeWidth={1.75}
                  className="text-[var(--moss-accent)]"
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  {name ? `${name}\u2019s field guide` : "The field guide"}
                </span>
              </div>
              <h2 className="font-display text-2xl font-semibold leading-tight text-[var(--ink-text)] sm:text-3xl">
                Pressed specimens & catalogued taxa
              </h2>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-[var(--ink-muted)]">
                Your own observations alongside species enriched from live GBIF,
                iNaturalist, and IUCN records.
              </p>
            </div>
            {totalCount > 0 && (
              <button
                type="button"
                onClick={() => openForm(null)}
                className="hidden h-10 items-center gap-2 rounded-full bg-[var(--moss-accent)] px-4 text-sm font-medium text-[var(--paper-surface)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4d6831] hover:shadow-md sm:flex"
              >
                <Compass size={16} strokeWidth={1.75} />
                Log a sighting
              </button>
            )}
          </motion.div>

          <SpecimenFeed
            observations={observations.observations}
            species={species.species}
            status={observations.status}
            error={observations.error}
            filter={species.filter}
            onFilter={species.setFilter}
            onReload={observations.load}
            onDelete={(id) => void observations.deleteObservation(id)}
            onStart={() => openForm(null)}
            onPickNearby={pickNearby}
          />
        </div>
      </div>

      <LogSightingFab onCreate={handleCreate} observerName={name} />

      <LogSightingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        observerName={name}
        onCreate={handleCreate}
        prefill={prefill}
      />
    </div>
  );
}

export default HomePage;
