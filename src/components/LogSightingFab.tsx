import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Feather, Plus } from "lucide-react";
import { LogSightingForm } from "@/components/LogSightingForm";
import type { Observation } from "@/types";
import { cn } from "@/lib/utils";

interface LogSightingFabProps {
  observerName?: string | null;
  onCreate: (obs: Observation) => Promise<Observation | null>;
  prefill?: Partial<Observation> | null;
  className?: string;
}

export function LogSightingFab({
  observerName,
  onCreate,
  prefill,
  className,
}: LogSightingFabProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 24, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "group fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2.5 rounded-full bg-[var(--terracotta-accent)] pl-4 pr-5 text-[var(--paper-surface)] shadow-[0_12px_32px_-10px_rgba(192,97,43,0.6)] transition-all duration-300 hover:bg-[#a8511f] hover:shadow-[0_16px_40px_-10px_rgba(192,97,43,0.7)] sm:bottom-7 sm:right-7",
          className
        )}
        aria-label="Log a sighting"
      >
        <span className="relative flex h-7 w-7 items-center justify-center">
          <Feather
            size={20}
            strokeWidth={1.75}
            className="absolute transition-all duration-300 group-hover:scale-0 group-hover:opacity-0"
          />
          <Plus
            size={22}
            strokeWidth={2}
            className="absolute scale-0 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
          />
        </span>
        <AnimatePresence>
          {(hovered || true) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              className="whitespace-nowrap text-sm font-semibold tracking-wide"
            >
              Log sighting
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <LogSightingForm
        open={open}
        onOpenChange={setOpen}
        observerName={observerName}
        onCreate={onCreate}
        prefill={prefill}
      />
    </>
  );
}

export default LogSightingFab;
