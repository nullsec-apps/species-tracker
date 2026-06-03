export interface IucnInfo {
  code: string;
  label: string;
  short: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  severity: number;
}

const MAP: Record<string, IucnInfo> = {
  EX: {
    code: "EX",
    label: "Extinct",
    short: "EX",
    description: "No known living individuals remain.",
    color: "#3B2A22",
    bg: "rgba(59,42,34,0.10)",
    border: "rgba(59,42,34,0.35)",
    severity: 8,
  },
  EW: {
    code: "EW",
    label: "Extinct in the Wild",
    short: "EW",
    description: "Survives only in cultivation or captivity.",
    color: "#5A3A2E",
    bg: "rgba(90,58,46,0.10)",
    border: "rgba(90,58,46,0.35)",
    severity: 7,
  },
  CR: {
    code: "CR",
    label: "Critically Endangered",
    short: "CR",
    description: "Extremely high risk of extinction in the wild.",
    color: "#A02E1F",
    bg: "rgba(160,46,31,0.10)",
    border: "rgba(160,46,31,0.35)",
    severity: 6,
  },
  EN: {
    code: "EN",
    label: "Endangered",
    short: "EN",
    description: "Very high risk of extinction in the wild.",
    color: "#C0612B",
    bg: "rgba(192,97,43,0.10)",
    border: "rgba(192,97,43,0.35)",
    severity: 5,
  },
  VU: {
    code: "VU",
    label: "Vulnerable",
    short: "VU",
    description: "High risk of extinction in the wild.",
    color: "#B8862B",
    bg: "rgba(184,134,43,0.12)",
    border: "rgba(184,134,43,0.38)",
    severity: 4,
  },
  NT: {
    code: "NT",
    label: "Near Threatened",
    short: "NT",
    description: "Likely to become threatened in the near future.",
    color: "#7C8A2E",
    bg: "rgba(124,138,46,0.12)",
    border: "rgba(124,138,46,0.38)",
    severity: 3,
  },
  LC: {
    code: "LC",
    label: "Least Concern",
    short: "LC",
    description: "Widespread and abundant; lowest risk.",
    color: "#5B7B3A",
    bg: "rgba(91,123,58,0.12)",
    border: "rgba(91,123,58,0.38)",
    severity: 1,
  },
  DD: {
    code: "DD",
    label: "Data Deficient",
    short: "DD",
    description: "Not enough data to assess extinction risk.",
    color: "#7C7A66",
    bg: "rgba(124,122,102,0.12)",
    border: "rgba(124,122,102,0.38)",
    severity: 2,
  },
  NE: {
    code: "NE",
    label: "Not Evaluated",
    short: "NE",
    description: "Has not yet been evaluated against the criteria.",
    color: "#7C7A66",
    bg: "rgba(124,122,102,0.10)",
    border: "rgba(124,122,102,0.30)",
    severity: 0,
  },
};

const ALIASES: Record<string, string> = {
  EXTINCT: "EX",
  "EXTINCT IN THE WILD": "EW",
  "CRITICALLY ENDANGERED": "CR",
  ENDANGERED: "EN",
  VULNERABLE: "VU",
  "NEAR THREATENED": "NT",
  "NEAR_THREATENED": "NT",
  "LEAST CONCERN": "LC",
  "LEAST_CONCERN": "LC",
  "DATA DEFICIENT": "DD",
  "DATA_DEFICIENT": "DD",
  "NOT EVALUATED": "NE",
  "NOT_EVALUATED": "NE",
};

export function normalizeIucn(
  value: string | null | undefined
): IucnInfo | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (MAP[upper]) return MAP[upper];
  if (ALIASES[upper] && MAP[ALIASES[upper]]) return MAP[ALIASES[upper]];
  // partial contains match
  for (const key of Object.keys(ALIASES)) {
    if (upper.includes(key)) return MAP[ALIASES[key]];
  }
  return null;
}

export function iucnLabel(value: string | null | undefined): string {
  const info = normalizeIucn(value);
  return info ? info.label : "Not Evaluated";
}

export function iucnColor(value: string | null | undefined): string {
  const info = normalizeIucn(value);
  return info ? info.color : MAP.NE.color;
}

export function iucnSeverity(value: string | null | undefined): number {
  const info = normalizeIucn(value);
  return info ? info.severity : 0;
}

export function isThreatened(value: string | null | undefined): boolean {
  return iucnSeverity(value) >= 4;
}

export const IUCN_ALL: IucnInfo[] = [
  MAP.EX,
  MAP.EW,
  MAP.CR,
  MAP.EN,
  MAP.VU,
  MAP.NT,
  MAP.LC,
  MAP.DD,
];
