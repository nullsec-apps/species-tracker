import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatCount(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "\u2014";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function formatFullCount(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "\u2014";
  return n.toLocaleString("en-US");
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  try {
    const d = value.includes("T") || value.includes("-") ? parseISO(value) : new Date(value);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function formatCollectionDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "\u2014";
  return format(d, "d MMM yyyy");
}

export function formatShortDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "\u2014";
  return format(d, "dd.MM.yy");
}

export function formatRelative(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "\u2014";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatScientificName(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim();
}

export function formatCoords(lat?: number | null, lng?: number | null): string {
  if (lat == null || lng == null) return "";
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}\u00b0${latDir}, ${Math.abs(lng).toFixed(3)}\u00b0${lngDir}`;
}
