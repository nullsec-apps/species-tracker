import { useCallback, useEffect, useRef, useState } from "react";
import type { Observation } from "@/types";
import {
  supabase,
  OBSERVATIONS_TABLE,
  hasSupabase,
} from "@/lib/supabaseClient";

export type ObsStatus = "loading" | "ready" | "error" | "offline";

export function useObservations(observerName?: string | null) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [status, setStatus] = useState<ObsStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const topic = useRef(`observations_${crypto.randomUUID()}`);

  const load = useCallback(async () => {
    if (!hasSupabase()) {
      setStatus("offline");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from(OBSERVATIONS_TABLE())
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (err) throw err;
      setObservations((data as Observation[]) || []);
      setStatus("ready");
    } catch (e: any) {
      setError(e?.message || "Failed to load observations.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const channel = supabase
      .channel(topic.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: OBSERVATIONS_TABLE() },
        (payload) => {
          setObservations((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Observation;
              if (prev.some((p) => p.id === row.id)) return prev;
              return [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Observation;
              return prev.map((p) => (p.id === row.id ? row : p));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Observation;
              return prev.filter((p) => p.id !== row.id);
            }
            return prev;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createObservation = useCallback(
    async (obs: Observation): Promise<Observation | null> => {
      if (!hasSupabase()) {
        const local: Observation = {
          ...obs,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        };
        setObservations((prev) => [local, ...prev]);
        return local;
      }
      const payload = {
        ...obs,
        observer_name: obs.observer_name ?? observerName ?? null,
        verification_status: obs.verification_status || "unverified",
      };
      const { data, error: err } = await supabase
        .from(OBSERVATIONS_TABLE())
        .insert(payload)
        .select()
        .single();
      if (err) throw err;
      const row = data as Observation;
      setObservations((prev) =>
        prev.some((p) => p.id === row.id) ? prev : [row, ...prev]
      );
      return row;
    },
    [observerName]
  );

  const updateObservation = useCallback(
    async (id: string, patch: Partial<Observation>) => {
      if (!hasSupabase()) {
        setObservations((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
        );
        return;
      }
      const { error: err } = await supabase
        .from(OBSERVATIONS_TABLE())
        .update(patch)
        .eq("id", id);
      if (err) throw err;
      setObservations((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    []
  );

  const deleteObservation = useCallback(async (id: string) => {
    if (!hasSupabase()) {
      setObservations((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    const { error: err } = await supabase
      .from(OBSERVATIONS_TABLE())
      .delete()
      .eq("id", id);
    if (err) throw err;
    setObservations((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const mine = observerName
    ? observations.filter(
        (o) =>
          (o.observer_name || "").toLowerCase() ===
          observerName.toLowerCase()
      )
    : observations;

  return {
    observations,
    mine,
    status,
    error,
    reload: load,
    createObservation,
    updateObservation,
    deleteObservation,
    count: observations.length,
  };
}
