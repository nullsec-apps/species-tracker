import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Upload, Loader2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  onUploaded?: (url: string | null) => void;
  className?: string;
}

export function PhotoUploader({ onUploaded, className }: PhotoUploaderProps) {
  const { status, progress, error, url, previewUrl, uploading, upload, reset } =
    usePhotoUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const result = await upload(file);
      onUploaded?.(result);
    },
    [upload, onUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const clear = useCallback(() => {
    reset();
    onUploaded?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [reset, onUploaded]);

  const showPreview = previewUrl || url;

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <AnimatePresence mode="wait">
        {showPreview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-[4px] border border-[rgba(124,122,102,0.35)] bg-[var(--paper-surface)] p-1.5 shadow-[0_8px_24px_-14px_rgba(44,51,36,0.4)]"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] bg-[var(--paper-bg)]">
              <img
                src={showPreview}
                alt="Specimen preview"
                className="h-full w-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[rgba(251,248,240,0.78)] backdrop-blur-[1px]">
                  <Loader2
                    className="animate-spin text-[var(--moss-accent)]"
                    size={22}
                    strokeWidth={2}
                  />
                  <span className="text-xs font-medium text-[var(--ink-muted)]">
                    {status === "reading" ? "Reading film…" : "Pressing specimen…"}
                  </span>
                </div>
              )}
              {status === "done" && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-[var(--moss-accent)] px-2.5 py-1 text-[11px] font-medium text-[var(--paper-surface)] shadow-sm"
                >
                  <Check size={13} strokeWidth={2.5} />
                  Pressed
                </motion.div>
              )}
            </div>
            <button
              type="button"
              onClick={clear}
              className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(124,122,102,0.4)] bg-[var(--paper-surface)] text-[var(--ink-muted)] shadow-sm transition-all duration-200 hover:scale-105 hover:text-[var(--terracotta-accent)]"
              aria-label="Remove photo"
            >
              <X size={14} strokeWidth={2} />
            </button>
            {uploading && (
              <Progress
                value={progress}
                className="mt-1.5 h-1.5 bg-[rgba(124,122,102,0.18)]"
              />
            )}
          </motion.div>
        ) : (
          <motion.button
            key="dropzone"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-2.5 rounded-[4px] border-2 border-dashed px-5 py-9 text-center transition-all duration-200",
              dragOver
                ? "border-[var(--moss-accent)] bg-[rgba(91,123,58,0.07)]"
                : "border-[rgba(124,122,102,0.4)] bg-[var(--paper-bg)] hover:border-[var(--moss-accent)] hover:bg-[rgba(91,123,58,0.04)]"
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(91,123,58,0.12)] transition-transform duration-200 group-hover:scale-105">
              <ImagePlus
                className="text-[var(--moss-accent)]"
                size={22}
                strokeWidth={1.75}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink-text)]">
                Press a specimen photo
              </p>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                Drag &amp; drop or click · JPG / PNG up to 8MB
              </p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-start gap-2 rounded-[3px] border border-[rgba(192,97,43,0.35)] bg-[rgba(192,97,43,0.08)] px-3 py-2"
        >
          <AlertTriangle
            className="mt-0.5 shrink-0 text-[var(--terracotta-accent)]"
            size={14}
            strokeWidth={2}
          />
          <p className="text-xs text-[var(--terracotta-accent)]">{error}</p>
        </motion.div>
      )}

      {!showPreview && (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="mt-2.5 h-10 w-full border-[rgba(124,122,102,0.4)] text-sm text-[var(--ink-text)] transition-all duration-200 hover:bg-[rgba(91,123,58,0.07)]"
        >
          <Upload size={15} strokeWidth={1.75} className="mr-1.5" />
          Choose photo
        </Button>
      )}
    </div>
  );
}

export default PhotoUploader;
