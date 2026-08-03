package me.peterrk.pan.backend.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.model.GameMap;
import me.peterrk.pan.backend.service.GameMapService;

@RestController
@RequestMapping("/api/gamemap")
public class GameMapController {

  @Autowired
  private GameMapService gameMapService;

  @GetMapping()
  public ResponseEntity<?> getAllGameMaps() {
    return ResponseEntity.status(HttpStatus.OK).body(gameMapService.getAllGameMaps());
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> getGameMap(@PathVariable("id") Long mapId) {
    GameMap gameMap = gameMapService.getGameMap(mapId);
    if (gameMap == null)
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Requested map not found");
    return ResponseEntity.status(HttpStatus.OK).body(gameMap);
  }

  @GetMapping("/{id}/locations")
  public ResponseEntity<?> getGameMapLocations(@PathVariable("id") Long mapId) {
    List<LatLng> locations = gameMapService.getCustomCoordinates(mapId);

    if (locations.isEmpty())
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No coordinates found or invalid map");

    return ResponseEntity.ok(locations);
  }

  @GetMapping("/{id}/locations/random")
  public ResponseEntity<?> getRandomLocation(@PathVariable("id") Long mapId) {
    List<LatLng> locations = gameMapService.getCustomCoordinates(mapId);

    if (locations.isEmpty())
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No coordinates found or invalid map");

    Random rand = new Random();
    LatLng location = locations.get(rand.nextInt(locations.size()));
    return ResponseEntity.status(HttpStatus.OK).body(location);
  }

  @PreAuthorize("hasAuthority('MANAGE_MAPS')")
  @PostMapping
  public ResponseEntity<?> uploadMap(
      @RequestParam("name") String name,
      @RequestParam("coordinates") MultipartFile coordinatesFile,
      @RequestParam("image") MultipartFile imageFile) {
    try {
      GameMap gameMap = gameMapService.uploadMap(name, coordinatesFile, imageFile);
      return ResponseEntity.status(HttpStatus.CREATED).body(gameMap);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to store uploaded map"));
    }
  }
}
