import { Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { ObserverIdentityGate } from "@/components/ObserverIdentityGate";
import { HomePage } from "@/pages/HomePage";
import { LogPage } from "@/pages/LogPage";
import { SpeciesPage } from "@/pages/SpeciesPage";
import { useObservations } from "@/hooks/useObservations";
import { useSpecies } from "@/hooks/useSpecies";
import { useObserverIdentity } from "@/hooks/useObserverIdentity";

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-[var(--ink-muted)]">
      <Loader2 size={18} className="animate-spin text-[var(--moss-accent)]" />
      Pressing the page\u2026
    </div>
  );
}

function Shell() {
  const location = useLocation();
  const { name } = useObserverIdentity();
  const species = useSpecies();
  const observations = useObservations(name);

  const showRail = location.pathname === "/";

  return (
    <AppShell
      species={species.species}
      filter={species.filter}
      onFilter={species.setFilter}
      count={species.count}
      observerName={name}
      showRail={showRail}
    >
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage species={species} observations={observations} />
            }
          />
          <Route
            path="/log"
            element={
              <LogPage species={species} observations={observations} />
            }
          />
          <Route
            path="/species/key/:taxonKey"
            element={
              <SpeciesPage species={species} observations={observations} />
            }
          />
          <Route
            path="/species/name/:name"
            element={
              <SpeciesPage species={species} observations={observations} />
            }
          />
          <Route
            path="*"
            element={
              <HomePage species={species} observations={observations} />
            }
          />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ObserverIdentityGate forceOpen />
      <Shell />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--paper-surface)",
            color: "var(--ink-text)",
            border: "1px solid rgba(124,122,102,0.3)",
            fontSize: "14px",
          },
        }}
      />
    </BrowserRouter>
  );
}
