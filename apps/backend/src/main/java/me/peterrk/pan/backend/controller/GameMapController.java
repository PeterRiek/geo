package me.peterrk.pan.backend.controller;

import java.io.IOException;
import java.util.List;
import java.util.Random;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonProperty;

import me.peterrk.pan.backend.dto.GameMapDto;
import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.model.GameMap;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.UserRepository;
import me.peterrk.pan.backend.service.GameMapService;

@RestController
@RequestMapping("/api/gamemap")
public class GameMapController {

  private static final String MANAGE_MAPS_AUTHORITY = "MANAGE_MAPS";

  private final GameMapService gameMapService;
  private final UserRepository userRepository;

  public GameMapController(GameMapService gameMapService, UserRepository userRepository) {
    this.gameMapService = gameMapService;
    this.userRepository = userRepository;
  }

  @GetMapping()
  public ResponseEntity<?> getAllGameMaps(Authentication auth) {
    User currentUser = currentUser(auth);
    List<GameMapDto> maps = gameMapService.getVisibleGameMaps(currentUser).stream()
        .map(m -> new GameMapDto(m, currentUser, gameMapService.resolveLocationCount(m)))
        .toList();
    return ResponseEntity.status(HttpStatus.OK).body(maps);
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> getGameMap(Authentication auth, @PathVariable("id") Long mapId) {
    User currentUser = currentUser(auth);
    GameMap gameMap = accessibleMap(mapId, currentUser);
    if (gameMap == null)
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Requested map not found");
    return ResponseEntity.status(HttpStatus.OK)
        .body(new GameMapDto(gameMap, currentUser, gameMapService.resolveLocationCount(gameMap)));
  }

  @GetMapping("/{id}/locations")
  public ResponseEntity<?> getGameMapLocations(Authentication auth, @PathVariable("id") Long mapId) {
    User currentUser = currentUser(auth);
    if (accessibleMap(mapId, currentUser) == null)
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Requested map not found");

    List<LatLng> locations = gameMapService.getCustomCoordinates(mapId);
    if (locations.isEmpty())
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No coordinates found or invalid map");

    return ResponseEntity.ok(locations);
  }

  @GetMapping("/{id}/locations/random")
  public ResponseEntity<?> getRandomLocation(Authentication auth, @PathVariable("id") Long mapId) {
    User currentUser = currentUser(auth);
    if (accessibleMap(mapId, currentUser) == null)
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Requested map not found");

    List<LatLng> locations = gameMapService.getCustomCoordinates(mapId);
    if (locations.isEmpty())
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No coordinates found or invalid map");

    Random rand = new Random();
    LatLng location = locations.get(rand.nextInt(locations.size()));
    return ResponseEntity.status(HttpStatus.OK).body(location);
  }

  // IllegalArgumentException (validation) and IOException (storage failure) are left to propagate
  // to GlobalExceptionHandler, which maps them to 400 and 500 respectively.
  @PostMapping
  public ResponseEntity<?> uploadMap(
      Authentication auth,
      @RequestParam("name") String name,
      @RequestParam("coordinates") MultipartFile coordinatesFile,
      @RequestParam("image") MultipartFile imageFile,
      @RequestParam(value = "isPublic", defaultValue = "false") boolean isPublic,
      @RequestParam(value = "maxErrorDistanceKm", required = false) Double maxErrorDistanceKm,
      @RequestParam(value = "description", required = false) String description) throws IOException {
    User currentUser = currentUser(auth);
    GameMap gameMap = gameMapService.uploadMap(name, coordinatesFile, imageFile, currentUser, isPublic,
        maxErrorDistanceKm, description);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(new GameMapDto(gameMap, currentUser, gameMapService.resolveLocationCount(gameMap)));
  }

  public record MaxDistanceResponse(double maxErrorDistanceKm) {
  }

  // Standalone calculation — doesn't require the map to exist yet, just a coordinates file
  // freshly picked in the upload form. Same exception-propagation convention as uploadMap above.
  @PostMapping("/calculate-max-distance")
  public ResponseEntity<?> calculateMaxDistance(@RequestParam("coordinates") MultipartFile coordinatesFile)
      throws IOException {
    double km = gameMapService.calculateMaxErrorDistanceKm(coordinatesFile);
    return ResponseEntity.ok(new MaxDistanceResponse(km));
  }

  // Explicit @JsonProperty on the boolean component: Jackson's is-stripping convention for
  // isXxx()-style accessors can otherwise bind "isPublic" as "public" — see GameMapDto for the
  // same issue on the response side.
  public record UpdateMapRequest(String name, @JsonProperty("isPublic") Boolean isPublic,
      Double maxErrorDistanceKm, String description) {
  }

  @PatchMapping("/{id}")
  public ResponseEntity<?> updateMap(Authentication auth, @PathVariable("id") Long mapId,
      @RequestBody UpdateMapRequest body) {
    User currentUser = currentUser(auth);
    GameMap gameMap = gameMapService.updateMap(mapId, body.name(), body.isPublic(), body.maxErrorDistanceKm(),
        body.description(), currentUser, isAdmin(auth));
    if (gameMap == null)
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Requested map not found");
    return ResponseEntity.ok(new GameMapDto(gameMap, currentUser, gameMapService.resolveLocationCount(gameMap)));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteMap(Authentication auth, @PathVariable("id") Long mapId) {
    User currentUser = currentUser(auth);
    boolean deleted = gameMapService.deleteMap(mapId, currentUser, isAdmin(auth));
    if (!deleted)
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Requested map not found");
    return ResponseEntity.noContent().build();
  }

  // Returns the map only if it exists and the current user can see it — 404 either way, so a
  // private map's existence isn't distinguishable from a nonexistent one.
  private GameMap accessibleMap(Long mapId, User currentUser) {
    GameMap map = gameMapService.getGameMap(mapId);
    if (map == null || !gameMapService.canAccess(map, currentUser.getUsername())) {
      return null;
    }
    return map;
  }

  private boolean isAdmin(Authentication auth) {
    return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(MANAGE_MAPS_AUTHORITY));
  }

  private User currentUser(Authentication auth) {
    return userRepository.findByUsername(auth.getName())
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }
}
