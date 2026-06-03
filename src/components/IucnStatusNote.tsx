import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { normalizeIucn } from "@/lib/iucn";
import { cn } from "@/lib/utils";

interface IucnStatusNoteProps {
  status?: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function IucnStatusNote({
  status,
  size = "md",
  showLabel = true,
  className,
}: IucnStatusNoteProps) {
  const info = normalizeIucn(status);
  if (!info) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[var(--ink-muted)]",
          size === "sm" && "text-[11px]",
          size === "md" && "text-xs",
          size === "lg" && "text-sm",
          className
        )}
      >
        <span className="inline-block h-2 w-2 rounded-full border border-[rgba(124,122,102,0.5)]" />
        {showLabel && <span className="italic">Not Evaluated</span>}
      </span>
    );
  }

  const dotSize = size === "sm" ? "h-2 w-2" : size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5";
  const textSize = size === "sm" ? "text-[11px]" : size === "lg" ? "text-sm" : "text-xs";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex cursor-help items-center gap-1.5 rounded-sm border px-2 py-0.5 font-medium transition-all duration-200 hover:shadow-sm",
              textSize,
              className
            )}
            style={{
              color: info.color,
              backgroundColor: info.bg,
              borderColor: info.border,
            }}
          >
            <span
              className={cn("inline-block shrink-0 rounded-full", dotSize)}
              style={{ backgroundColor: info.color }}
            />
            {showLabel ? (
              <span className="whitespace-nowrap">
                <span className="font-semibold">IUCN</span> \u00b7 {info.label}
              </span>
            ) : (
              <span className="font-semibold">{info.short}</span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[240px] border border-[rgba(124,122,102,0.3)] bg-[var(--paper-surface)] text-[var(--ink-text)]"
        >
          <p className="font-display text-sm font-semibold" style={{ color: info.color }}>
            {info.label} ({info.short})
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
            {info.description}
          </p>
          <p className="mt-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
            IUCN Red List \u00b7 via GBIF
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default IucnStatusNote;
