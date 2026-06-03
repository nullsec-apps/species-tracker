import { motion } from "framer-motion";
import { MapPin, Calendar, User } from "lucide-react";
import { formatCollectionDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CollectionTagProps {
  observedAt?: string | Date | null;
  locationName?: string | null;
  observerName?: string | null;
  className?: string;
  tilt?: boolean;
}

export function CollectionTag({
  observedAt,
  locationName,
  observerName,
  className,
  tilt = true,
}: CollectionTagProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "collection-tag inline-block max-w-full rounded-[3px] border border-[rgba(124,122,102,0.35)] bg-[var(--paper-surface)] px-3 py-2 text-[var(--ink-text)] shadow-[0_1px_3px_rgba(44,51,36,0.12)]",
        tilt && "-rotate-1",
        className
      )}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} strokeWidth={1.75} className="shrink-0 text-[var(--moss-accent)]" />
          <span className="handwriting text-[13px] leading-tight">
            {observedAt ? formatCollectionDate(observedAt) : "Date unknown"}
          </span>
        </div>
        {locationName ? (
          <div className="flex items-center gap-1.5">
            <MapPin size={13} strokeWidth={1.75} className="shrink-0 text-[var(--terracotta-accent)]" />
            <span className="handwriting truncate text-[13px] leading-tight" title={locationName}>
              {locationName}
            </span>
          </div>
        ) : null}
        {observerName ? (
          <div className="flex items-center gap-1.5">
            <User size={13} strokeWidth={1.75} className="shrink-0 text-[var(--ink-muted)]" />
            <span className="handwriting truncate text-[13px] leading-tight" title={observerName}>
              coll. {observerName}
            </span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export default CollectionTag;
