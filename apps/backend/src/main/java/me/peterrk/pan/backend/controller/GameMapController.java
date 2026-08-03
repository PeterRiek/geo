package me.peterrk.pan.backend.controller;

import java.io.IOException;
import java.util.List;
import java.util.Random;

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

  private final GameMapService gameMapService;

  public GameMapController(GameMapService gameMapService) {
    this.gameMapService = gameMapService;
  }

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

  // IllegalArgumentException (validation) and IOException (storage failure) are left to propagate
  // to GlobalExceptionHandler, which maps them to 400 and 500 respectively.
  @PreAuthorize("hasAuthority('MANAGE_MAPS')")
  @PostMapping
  public ResponseEntity<?> uploadMap(
      @RequestParam("name") String name,
      @RequestParam("coordinates") MultipartFile coordinatesFile,
      @RequestParam("image") MultipartFile imageFile) throws IOException {
    GameMap gameMap = gameMapService.uploadMap(name, coordinatesFile, imageFile);
    return ResponseEntity.status(HttpStatus.CREATED).body(gameMap);
  }
}
