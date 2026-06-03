import { motion } from "framer-motion";
import { ArrowRight, Compass, Leaf, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProofSpecimenCard } from "@/components/ProofSpecimenCard";
import { cn } from "@/lib/utils";

interface HeroProps {
  onStart?: () => void;
  onExplore?: () => void;
  className?: string;
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero({ onStart, onExplore, className }: HeroProps) {
  return (
    <section
      className={cn(
        "paper-grain relative w-full overflow-hidden border-b border-[rgba(124,122,102,0.25)]",
        className
      )}
    >
      {/* botanical wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-[0.07] blur-2xl"
        style={{ background: "radial-gradient(circle, #5B7B3A 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full opacity-[0.06] blur-2xl"
        style={{ background: "radial-gradient(circle, #C0612B 0%, transparent 70%)" }}
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10"
        >
          <motion.div
            variants={item}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(91,123,58,0.35)] bg-[rgba(91,123,58,0.08)] px-3 py-1.5"
          >
            <Leaf className="text-[var(--moss-accent)]" size={13} strokeWidth={1.75} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--moss-accent)]">
              A living field journal
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--ink-text)] sm:text-5xl lg:text-6xl"
          >
            Every sighting tells the
            <span className="relative ml-2 italic text-[var(--moss-accent)]">
              story
            </span>{" "}
            of a place.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg"
          >
            Log, identify, and explore wildlife with a living field guide backed by
            real{" "}
            <span className="font-semibold text-[var(--ink-text)]">GBIF</span>{" "}
            occurrence records and{" "}
            <span className="font-semibold text-[var(--ink-text)]">iNaturalist</span>{" "}
            observations — from backyard moths to alpine wildflowers.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button
              type="button"
              onClick={onStart}
              className="group h-12 gap-2 bg-[var(--moss-accent)] px-6 text-base text-[var(--paper-surface)] shadow-sm transition-all duration-200 hover:bg-[#4d6831] hover:shadow-md"
            >
              <Compass size={18} strokeWidth={1.75} />
              Start your first observation
              <ArrowRight
                size={16}
                strokeWidth={2}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onExplore}
              className="h-12 gap-2 border-[rgba(124,122,102,0.4)] px-5 text-base text-[var(--ink-text)] transition-all duration-200 hover:bg-[rgba(91,123,58,0.07)]"
            >
              <BookOpen size={17} strokeWidth={1.75} />
              Explore the guide
            </Button>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--ink-muted)]"
          >
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--moss-accent)]" />
              Live GBIF taxonomy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--terracotta-accent)]" />
              IUCN Red List status
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#A88A2E]" />
              Real range maps
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex justify-center lg:justify-end"
        >
          <ProofSpecimenCard />
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
