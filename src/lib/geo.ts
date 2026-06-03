import type { GeoPosition } from "@/types";

export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(new Error(err.message || "Unable to get location.")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lng}&count=1`;
    // Try direct reverse via open-meteo nearest place fallback to formatted coords
    const res = await fetch(
      `https://api.nullsec.studio/fetch-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`,
          appId: (window as any).__NULLSEC__?.projectId || "species",
        }),
      }
    );
    if (res.ok) {
      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        const body =
          typeof parsed === "object" && parsed.contents
            ? JSON.parse(parsed.contents)
            : parsed;
        const a = body?.address || {};
        const parts = [
          a.village || a.town || a.city || a.hamlet,
          a.state || a.region,
          a.country,
        ].filter(Boolean);
        if (parts.length) return parts.join(", ");
        if (body?.display_name)
          return String(body.display_name).split(",").slice(0, 3).join(",").trim();
      } catch {
        // ignore
      }
    }
    void url;
  } catch {
    // ignore
  }
  return formatLatLng(lat, lng);
}

export function formatLatLng(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}\u00b0${latDir} ${Math.abs(lng).toFixed(
    2
  )}\u00b0${lngDir}`;
}

export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);
  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
  };
}
