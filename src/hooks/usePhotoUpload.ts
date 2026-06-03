import { useCallback, useRef, useState } from "react";
import { projectId } from "@/lib/supabaseClient";

const UPLOAD_ENDPOINT = "https://api.nullsec.studio/upload";
const MAX_BYTES = 8 * 1024 * 1024;

export type UploadStatus = "idle" | "reading" | "uploading" | "done" | "error";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

export function usePhotoUpload() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setStatus("idle");
    setProgress(0);
    setError(null);
    setUrl(null);
    setPreviewUrl(null);
  }, []);

  const upload = useCallback(async (file: File): Promise<string | null> => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      setStatus("error");
      return null;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large \u2014 keep it under 8MB.");
      setStatus("error");
      return null;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const localPreview = URL.createObjectURL(file);
    previewRef.current = localPreview;
    setPreviewUrl(localPreview);

    try {
      setStatus("reading");
      setProgress(15);
      const base64Data = await fileToBase64(file);
      setStatus("uploading");
      setProgress(55);

      const res = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: projectId(),
          filename: file.name || `specimen-${Date.now()}.jpg`,
          base64Data,
          contentType: file.type || "image/jpeg",
        }),
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
      const data = await res.json().catch(() => null);
      const uploadedUrl: string | undefined = data?.url || data?.Location || data?.location;
      if (!uploadedUrl) throw new Error("Upload did not return a URL.");
      setProgress(100);
      setStatus("done");
      setUrl(uploadedUrl);
      return uploadedUrl;
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Could not upload the specimen photo.");
      setProgress(0);
      return null;
    }
  }, []);

  return {
    status,
    progress,
    error,
    url,
    previewUrl,
    uploading: status === "reading" || status === "uploading",
    upload,
    reset,
  };
}
