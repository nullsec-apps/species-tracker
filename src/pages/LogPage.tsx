import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ObservationLog } from "@/components/ObservationLog";
import { NearbyOccurrences } from "@/components/NearbyOccurrences";
import { LogSightingForm } from "@/components/LogSightingForm";
import { LogSightingFab } from "@/components/LogSightingFab";
import { useObservations } from "@/hooks/useObservations";
import { useSpecies } from "@/hooks/useSpecies";
import {
  useNearbyOccurrences,
  type NearbySpecies,
} from "@/hooks/useNearbyOccurrences";
import { useObserverIdentity } from "@/hooks/useObserverIdentity";
import type { Observation } from "@/types";

interface LogPageProps {
  species: ReturnType<typeof useSpecies>;
  observations: ReturnType<typeof useObservations>;
}

export function LogPage({ species, observations }: LogPageProps) {
  const { name } = useObserverIdentity();
  const nearby = useNearbyOccurrences(5, 7);
  const [formOpen, setFormOpen] = useState(false);
  const [prefill, setPrefill] = useState<Partial<Observation> | null>(null);

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

  const mine = name ? observations.mine : observations.observations;
  const hasAny = mine.length > 0;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ObservationLog
          observations={mine}
          observerName={name}
          status={observations.status}
          error={observations.error}
          onReload={observations.load}
          onDelete={(id) => observations.deleteObservation(id)}
          onRankClick={species.setFilter}
          onStart={() => openForm(null)}
          onPickNearby={pickNearby}
        />
      </motion.div>

      {hasAny && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10"
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
      )}

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

export default LogPage;
