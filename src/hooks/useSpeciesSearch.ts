import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeciesSuggestion } from "@/types";
import { suggestSpecies } from "@/lib/gbif";

export type SearchStatus = "idle" | "searching" | "ready" | "error";

export function useSpeciesSearch(debounceMs = 280) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpeciesSuggestion[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  const run = useCallback(async (q: string) => {
    const id = ++reqId.current;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setStatus("idle");
      setError(null);
      return;
    }
    setStatus("searching");
    setError(null);
    try {
      const data = await suggestSpecies(trimmed);
      if (id !== reqId.current) return;
      setResults(data);
      setStatus("ready");
    } catch (e: any) {
      if (id !== reqId.current) return;
      setError(e?.message || "Search failed. Try again.");
      setStatus("error");
      setResults([]);
    }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void run(query);
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, debounceMs, run]);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setStatus("idle");
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    status,
    error,
    clear,
    isSearching: status === "searching",
    hasResults: results.length > 0,
  };
}
