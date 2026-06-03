import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { SpeciesDetail } from "@/components/SpeciesDetail";
import { LogSightingForm } from "@/components/LogSightingForm";
import { useObservations } from "@/hooks/useObservations";
import { useSpecies } from "@/hooks/useSpecies";
import { useObserverIdentity } from "@/hooks/useObserverIdentity";
import type { Observation } from "@/types";

interface SpeciesPageProps {
  species: ReturnType<typeof useSpecies>;
  observations: ReturnType<typeof useObservations>;
}

export function SpeciesPage({ species, observations }: SpeciesPageProps) {
  const { taxonKey, name: routeName } = useParams<{
    taxonKey?: string;
    name?: string;
  }>();
  const { name } = useObserverIdentity();
  const [formOpen, setFormOpen] = useState(false);
  const [prefill, setPrefill] = useState<Partial<Observation> | null>(null);

  const byName = routeName ? decodeURIComponent(routeName) : null;

  const handleLogSpecies = useCallback((p: Partial<Observation>) => {
    setPrefill(p);
    setFormOpen(true);
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

  return (
    <div>
      <SpeciesDetail
        key={taxonKey || byName || "species"}
        taxonKey={taxonKey || null}
        byName={byName}
        onLogSpecies={handleLogSpecies}
      />

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

export default SpeciesPage;
