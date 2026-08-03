package me.peterrk.pan.backend.util;

import me.peterrk.pan.backend.dto.ws.LatLng;

/** Mirrors apps/web/src/lib/geo.ts — kept in sync so persisted results match what players saw. */
public final class GeoUtils {

  private static final double EARTH_RADIUS_KM = 6371;
  private static final double MAX_DISTANCE_KM = 10_000;

  private GeoUtils() {
  }

  public static double distanceKm(LatLng a, LatLng b) {
    double dLat = Math.toRadians(b.lat - a.lat);
    double dLng = Math.toRadians(b.lng - a.lng);
    double lat1 = Math.toRadians(a.lat);
    double lat2 = Math.toRadians(b.lat);

    double h = Math.pow(Math.sin(dLat / 2), 2)
        + Math.pow(Math.sin(dLng / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
    double c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    return EARTH_RADIUS_KM * c;
  }

  public static int score(double distanceKm) {
    return (int) Math.round(5000 * Math.exp(-10 * (distanceKm / MAX_DISTANCE_KM)));
  }
}
