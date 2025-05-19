package me.peterrk.pan.backend.controller;

import java.util.List;
import java.util.Random;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.peterrk.pan.backend.dto.ws.LatLng;

@RestController
@RequestMapping("/api/map")
public class MapController {

  @GetMapping("/{id}/random")
  public ResponseEntity<?> getRandomLocation(@PathVariable("id") String mapId) {
    List<LatLng> locations = fetchLocationsByMapId(mapId);

    if (locations.isEmpty())
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Requested map not found");

    Random rand = new Random();
    LatLng location = locations.get(rand.nextInt(locations.size()));
    return ResponseEntity.status(HttpStatus.OK).body(location);
  }

  private List<LatLng> fetchLocationsByMapId(String mapId) {
    // Dummy method: replace with real data access
    // TODO: replace by get mapdata url from db and fetch json
    // TODO: integrate into ws duels
    if (mapId.equals("empty"))
      return List.of();
    return List.of(
        new LatLng(60.327760220139645, 19.916788229531633),
        new LatLng(50.084753267843695, 14.424322057315528)

    );
  }
}
