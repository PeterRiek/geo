package me.peterrk.pan.backend.util;

import me.peterrk.pan.backend.dto.ws.LatLng;

public class GeoUtil {

  public static double toRadians(double deg) {
    return (deg * Math.PI) / 180;
  }

  public static double getDistanceInKM(LatLng a, LatLng b) {
    var R = 6371d; // radius of earth in km
    var dLat = toRadians(b.lat - a.lat);
    var dLng = toRadians(b.lng - a.lng);
    var x = Math.pow(Math.sin(dLat / 2), 2) +
        Math.pow(Math.sin(dLng / 2), 2) * Math.cos(a.lat) * Math.cos(b.lat);
    var c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    return R * c;
  }

}
