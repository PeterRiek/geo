import { Coords } from "@/types/geo";

export function getCenterCoords(c1: Coords, c2: Coords) {
  return {
    lat: (c1.lat + c2.lat) / 2,
    lng: (c1.lng + c2.lng) / 2,
  };
}

export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${Math.round(km)} km`;
}