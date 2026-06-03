import { useCallback, useEffect, useState } from "react";
import type { ObserverIdentity } from "@/types";

const KEY = "species_observer_identity_v1";

function read(): ObserverIdentity | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === "string" && parsed.name.trim()) {
      return {
        name: parsed.name.trim(),
        createdAt: parsed.createdAt || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function useObserverIdentity() {
  const [identity, setIdentity] = useState<ObserverIdentity | null>(() => read());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIdentity(read());
    setReady(true);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setIdentity(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: ObserverIdentity = {
      name: trimmed,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
    setIdentity(next);
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setIdentity(null);
  }, []);

  return {
    identity,
    name: identity?.name ?? null,
    hasIdentity: Boolean(identity?.name),
    ready,
    setName,
    clear,
  };
}
