import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { Loader2, MapPinOff, RefreshCw, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRangeMap } from "@/hooks/useRangeMap";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

interface RangeMapProps {
  taxonKey: string | number | null | undefined;
  thumbnail?: boolean;
  height?: number;
  className?: string;
}

function FitView({
  center,
  hasData,
}: {
  center: [number, number];
  hasData: boolean;
}) {
  // imperative recenter handled by key remount on parent; noop placeholder
  return null;
}

export function RangeMap({
  taxonKey,
  thumbnail = false,
  height = 320,
  className,
}: RangeMapProps) {
  const { occurrences, status, error, refresh, center, count } =
    useRangeMap(taxonKey, thumbnail ? 140 : 300);
  const [revealCount, setRevealCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  // staggered cascade reveal of dots
  useEffect(() => {
    if (status !== "ready" || !occurrences.length) {
      setRevealCount(0);
      return;
    }
    setRevealCount(0);
    let i = 0;
    const total = occurrences.length;
    const step = Math.max(1, Math.round(total / 40));
    const tick = () => {
      i = Math.min(total, i + step);
      setRevealCount(i);
      if (i < total) {
        rafRef.current = window.setTimeout(
          () => requestAnimationFrame(tick),
          18
        ) as unknown as number;
      }
    };
    rafRef.current = window.setTimeout(
      () => requestAnimationFrame(tick),
      120
    ) as unknown as number;
    return () => {
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [status, occurrences]);

  const visible = useMemo(
    () => occurrences.slice(0, revealCount),
    [occurrences, revealCount]
  );

  const zoom = thumbnail ? 1 : 2;

  if (status === "loading" || status === "idle") {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center bg-[var(--paper-bg)]",
          className
        )}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2 text-[var(--ink-muted)]">
          <Loader2 className="animate-spin text-[var(--moss-accent)]" size={20} />
          {!thumbnail && (
            <span className="text-xs">Plotting occurrence records…</span>
          )}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 bg-[var(--paper-bg)] px-4 text-center",
          className
        )}
        style={{ height }}
      >
        <MapPinOff className="text-[var(--terracotta-accent)]" size={20} />
        <p className="text-xs text-[var(--ink-muted)]">
          {error || "Couldn't load the range map."}
        </p>
        {!thumbnail && (
          <Button
            size="sm"
            variant="outline"
            onClick={refresh}
            className="h-8 border-[rgba(124,122,102,0.4)] text-xs"
          >
            <RefreshCw size={13} className="mr-1.5" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 bg-[var(--paper-bg)] px-4 text-center",
          className
        )}
        style={{ height }}
      >
        <Globe2 className="text-[var(--ink-muted)]" size={20} strokeWidth={1.5} />
        <p className="text-xs text-[var(--ink-muted)]">
          No georeferenced occurrence records found.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={!thumbnail}
        dragging={!thumbnail}
        zoomControl={!thumbnail}
        doubleClickZoom={!thumbnail}
        attributionControl={false}
        style={{ height: "100%", width: "100%", background: "#E9E3D2" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
        />
        {visible.map((o, i) => (
          <CircleMarker
            key={`${o.latitude}-${o.longitude}-${i}`}
            center={[o.latitude, o.longitude]}
            radius={thumbnail ? 2.4 : 3.4}
            pathOptions={{
              color: "#5B7B3A",
              fillColor: "#5B7B3A",
              fillOpacity: 0.55,
              weight: 0.5,
            }}
          />
        ))}
      </MapContainer>

      {!thumbnail && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pointer-events-none absolute bottom-3 left-3 z-[400] flex items-center gap-2 rounded-[3px] border border-[rgba(124,122,102,0.35)] bg-[rgba(251,248,240,0.9)] px-3 py-1.5 backdrop-blur-sm"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--moss-accent)]" />
          <span className="font-serif text-xs italic text-[var(--ink-text)]">
            {formatCount(count)} plotted records
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default RangeMap;
