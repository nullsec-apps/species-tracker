import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Feather } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useObserverIdentity } from "@/hooks/useObserverIdentity";
import { cn } from "@/lib/utils";

interface ObserverIdentityGateProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onComplete?: (name: string) => void;
  forceOpen?: boolean;
}

export function ObserverIdentityGate({
  open,
  onOpenChange,
  onComplete,
  forceOpen = false,
}: ObserverIdentityGateProps) {
  const { setName, hasIdentity, ready } = useObserverIdentity();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const controlled = typeof open === "boolean";
  const isOpen = controlled
    ? open
    : forceOpen && ready && !hasIdentity;

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError("Please enter at least 2 characters.");
      return;
    }
    if (trimmed.length > 48) {
      setError("Keep it under 48 characters.");
      return;
    }
    setName(trimmed);
    onComplete?.(trimmed);
    onOpenChange?.(false);
    setValue("");
    setError(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="paper-grain max-w-md border border-[rgba(124,122,102,0.3)] bg-[var(--paper-surface)] text-[var(--ink-text)]"
        onInteractOutside={(e) => {
          if (forceOpen && !hasIdentity) e.preventDefault();
        }}
      >
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(91,123,58,0.12)]"
          >
            <Feather size={26} strokeWidth={1.5} className="text-[var(--moss-accent)]" />
          </motion.div>
          <DialogTitle className="text-center font-display text-2xl leading-tight">
            Sign your field journal
          </DialogTitle>
        </DialogHeader>

        <p className="text-center text-sm leading-relaxed text-[var(--ink-muted)]">
          Every specimen you press carries a collector's name. Add yours so your
          observations are tagged and tracked across sessions.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="observer-name"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]"
            >
              Observer name or handle
            </Label>
            <Input
              id="observer-name"
              value={value}
              autoFocus
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Sarah Chen"
              className={cn(
                "h-12 border-[rgba(124,122,102,0.35)] bg-[var(--paper-bg)] text-base text-[var(--ink-text)] placeholder:text-[var(--ink-muted)] focus-visible:ring-[var(--moss-accent)]",
                error && "border-[var(--terracotta-accent)]"
              )}
            />
            {error && (
              <p className="text-xs text-[var(--terracotta-accent)]">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="h-12 w-full bg-[var(--moss-accent)] text-base text-[var(--paper-surface)] transition-all duration-200 hover:bg-[#4d6831] hover:shadow-md"
          >
            <Leaf size={17} className="mr-2" />
            Begin collecting
          </Button>
        </form>

        <p className="mt-1 text-center text-[11px] text-[var(--ink-muted)]">
          Stored locally on this device \u00b7 no account required
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default ObserverIdentityGate;
