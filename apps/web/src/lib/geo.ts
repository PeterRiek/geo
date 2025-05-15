/**
 * Calculates the distance between two lat/lng coordinates using the Haversine formula.
 * @param coord1 - First coordinate { lat, lng }
 * @param coord2 - Second coordinate { lat, lng }
 * @returns Distance in kilometers
 */
export function getDistanceInKm(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}