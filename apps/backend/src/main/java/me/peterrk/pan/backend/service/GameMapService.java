package me.peterrk.pan.backend.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.model.FavoriteMap;
import me.peterrk.pan.backend.model.GameMap;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.FavoriteMapRepository;
import me.peterrk.pan.backend.repository.GameMapRepository;
import me.peterrk.pan.backend.repository.GameSessionRepository;
import me.peterrk.pan.backend.util.GeoUtils;

@Service
public class GameMapService {

  private static final Logger log = LoggerFactory.getLogger(GameMapService.class);

  private static final int MAX_COORDINATE_COUNT = 20_000;
  private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
  private static final double MAX_ERROR_DISTANCE_KM_LIMIT = 20_000;
  private static final int MAX_DESCRIPTION_LENGTH = 2_000;
  // Limited to formats the JDK's built-in ImageIO can decode (used below to verify the upload is
  // a genuine image, not just a file with a spoofed content-type) — no webp plugin on the classpath.
  private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of(
      "image/jpeg", "jpg",
      "image/png", "png");

  private final GameMapRepository gameMapRepository;
  private final FavoriteMapRepository favoriteMapRepository;
  private final GameSessionRepository gameSessionRepository;
  private final RestTemplate restTemplate;

  @Value("${app.uploads.dir:uploads}")
  private String uploadsDir;

  private final ObjectMapper objectMapper = new ObjectMapper();

  public GameMapService(GameMapRepository gameMapRepository, FavoriteMapRepository favoriteMapRepository,
      GameSessionRepository gameSessionRepository, RestTemplate restTemplate) {
    this.gameMapRepository = gameMapRepository;
    this.favoriteMapRepository = favoriteMapRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.restTemplate = restTemplate;
  }

  public GameMap getGameMap(Long id) {
    return gameMapRepository.findById(id).orElse(null);
  }

  public List<GameMap> getVisibleGameMaps(User currentUser) {
    return gameMapRepository.findVisibleTo(currentUser.getId());
  }

  public boolean canAccess(GameMap map, String username) {
    return isEffectivelyPublic(map) || (map.getOwner() != null && map.getOwner().getUsername().equals(username));
  }

  public boolean isOwner(GameMap map, User user) {
    return map.getOwner() != null && user != null && map.getOwner().getId().equals(user.getId());
  }

  private boolean isEffectivelyPublic(GameMap map) {
    return map.getIsPublic() == null || map.getIsPublic();
  }

  public boolean isFavorite(Long mapId, Long userId) {
    return favoriteMapRepository.existsByUserIdAndMapId(userId, mapId);
  }

  public Set<Long> getFavoriteMapIds(User user) {
    return new HashSet<>(favoriteMapRepository.findMapIdsByUserId(user.getId()));
  }

  // Global play counts across all users, keyed by mapId — powers the "most played" sort in the
  // maps library. Bulk query, mirroring getFavoriteMapIds, rather than one query per map.
  public Map<Long, Long> getPlayCounts() {
    Map<Long, Long> counts = new HashMap<>();
    for (Object[] row : gameSessionRepository.countSessionsByMapId()) {
      counts.put((Long) row[0], (Long) row[1]);
    }
    return counts;
  }

  public long getPlayCount(Long mapId) {
    return getPlayCounts().getOrDefault(mapId, 0L);
  }

  public void addFavorite(Long mapId, User user) {
    if (!favoriteMapRepository.existsByUserIdAndMapId(user.getId(), mapId)) {
      favoriteMapRepository.save(new FavoriteMap(user.getId(), mapId));
    }
  }

  public void removeFavorite(Long mapId, User user) {
    favoriteMapRepository.deleteByUserIdAndMapId(user.getId(), mapId);
  }

  public List<LatLng> getCustomCoordinates(Long mapId) {
    GameMap gameMap = getGameMap(mapId);
    if (gameMap == null) {
      return List.of();
    }

    try {
      String jsonData = readCoordinatesJson(gameMap.getJsonFileUrl());
      return parseCoordinates(jsonData);
    } catch (Exception e) {
      return List.of();
    }
  }

  private String readCoordinatesJson(String jsonFileUrl) throws IOException {
    if (jsonFileUrl.startsWith("http://") || jsonFileUrl.startsWith("https://")) {
      return restTemplate.getForObject(jsonFileUrl, String.class);
    }
    // Uploaded map: jsonFileUrl is a path relative to the uploads dir, never
    // exposed over HTTP — read it directly off disk instead.
    Path path = coordinatesRoot().resolve(jsonFileUrl).normalize();
    if (!path.startsWith(coordinatesRoot())) {
      throw new IOException("Invalid coordinates path");
    }
    return Files.readString(path);
  }

  private List<LatLng> parseCoordinates(String jsonData) throws IOException {
    JsonNode root = objectMapper.readTree(jsonData);
    JsonNode coordsNode = root.path("customCoordinates");
    if (!coordsNode.isArray()) {
      return List.of();
    }

    List<LatLng> coordinates = new ArrayList<>();
    for (JsonNode node : coordsNode) {
      double lat = node.path("lat").asDouble();
      double lng = node.path("lng").asDouble();
      coordinates.add(new LatLng(lat, lng));
    }

    return coordinates;
  }

  /**
   * Validates and stores an uploaded map's coordinates JSON + preview image, then creates the
   * GameMap row. Throws IllegalArgumentException for validation failures (caller should respond
   * 400) and IOException for storage failures (caller should respond 500).
   */
  public GameMap uploadMap(String name, MultipartFile coordinatesFile, MultipartFile imageFile, User owner,
      boolean isPublic, Double maxErrorDistanceKm, String description) throws IOException {
    String trimmedName = name == null ? "" : name.trim();
    if (trimmedName.isEmpty()) {
      throw new IllegalArgumentException("Map name is required");
    }
    if (coordinatesFile == null || coordinatesFile.isEmpty()) {
      throw new IllegalArgumentException("A coordinates JSON file is required");
    }
    if (imageFile == null || imageFile.isEmpty()) {
      throw new IllegalArgumentException("A preview image is required");
    }
    validateMaxErrorDistance(maxErrorDistanceKm);
    String trimmedDescription = validateDescription(description);

    byte[] coordinatesBytes = coordinatesFile.getBytes();
    List<LatLng> coordinates = validateCoordinates(coordinatesBytes);

    byte[] imageBytes = validateImage(imageFile);
    String imageExtension = ALLOWED_IMAGE_TYPES.get(imageFile.getContentType());

    Files.createDirectories(coordinatesRoot());
    Files.createDirectories(imagesRoot());

    String coordinatesFileName = UUID.randomUUID() + ".json";
    Path coordinatesPath = coordinatesRoot().resolve(coordinatesFileName);
    String imageFileName = UUID.randomUUID() + "." + imageExtension;
    Path imagePath = imagesRoot().resolve(imageFileName);

    // Neither the two file writes nor the DB save are transactional with each other, so on any
    // failure past this point we clean up whatever already landed on disk rather than leaving an
    // orphaned, unreferenced file behind.
    try {
      Files.write(coordinatesPath, coordinatesBytes);
      Files.write(imagePath, imageBytes);

      GameMap gameMap = new GameMap(trimmedName, coordinatesFileName, "/uploads/images/" + imageFileName);
      gameMap.setOwner(owner);
      gameMap.setIsPublic(isPublic);
      gameMap.setMaxErrorDistanceKm(maxErrorDistanceKm);
      gameMap.setDescription(trimmedDescription);
      gameMap.setLocationCount(coordinates.size());
      return gameMapRepository.save(gameMap);
    } catch (Exception e) {
      Files.deleteIfExists(coordinatesPath);
      Files.deleteIfExists(imagePath);
      throw e;
    }
  }

  /**
   * Returns this map's cached location count, computing and persisting it once for legacy rows
   * that predate the locationCount column. A transient read/parse failure (getCustomCoordinates
   * swallows all exceptions into an empty list) returns 0 for this call without persisting, so a
   * later read retries the parse instead of permanently caching a wrong 0 — uploadMap's
   * validateCoordinates already rejects genuinely-empty coordinate files at write time, so a real
   * map should never legitimately resolve to 0.
   */
  public int resolveLocationCount(GameMap map) {
    if (map.getLocationCount() != null) {
      return map.getLocationCount();
    }
    List<LatLng> coordinates = getCustomCoordinates(map.getId());
    if (coordinates.isEmpty()) {
      return 0;
    }
    int count = coordinates.size();
    map.setLocationCount(count);
    gameMapRepository.save(map);
    return count;
  }

  /**
   * Suggests a maxErrorDistanceKm for a not-yet-uploaded coordinates file: the haversine distance
   * between the NE and SW corners of the coordinates' bounding box. Doesn't touch the DB or
   * require a map to exist yet — reuses the same validation uploadMap applies (size/range limits).
   * Throws IllegalArgumentException for validation failures, IOException for unreadable JSON.
   */
  public double calculateMaxErrorDistanceKm(MultipartFile coordinatesFile) throws IOException {
    if (coordinatesFile == null || coordinatesFile.isEmpty()) {
      throw new IllegalArgumentException("A coordinates JSON file is required");
    }
    List<LatLng> coordinates = validateCoordinates(coordinatesFile.getBytes());
    return boundingBoxMaxErrorDistanceKm(coordinates);
  }

  /**
   * Same suggestion as {@link #calculateMaxErrorDistanceKm(MultipartFile)}, but for a map that's
   * already uploaded — reuses its stored coordinates instead of a freshly-picked file. Used by the
   * edit dialog's "Calculate" button. Throws IllegalArgumentException if the map has no coordinates.
   */
  public double calculateMaxErrorDistanceKm(Long mapId) {
    List<LatLng> coordinates = getCustomCoordinates(mapId);
    if (coordinates.isEmpty()) {
      throw new IllegalArgumentException("No coordinates found for this map");
    }
    return boundingBoxMaxErrorDistanceKm(coordinates);
  }

  private double boundingBoxMaxErrorDistanceKm(List<LatLng> coordinates) {
    double minLat = Double.MAX_VALUE;
    double maxLat = -Double.MAX_VALUE;
    double minLng = Double.MAX_VALUE;
    double maxLng = -Double.MAX_VALUE;
    for (LatLng c : coordinates) {
      minLat = Math.min(minLat, c.lat);
      maxLat = Math.max(maxLat, c.lat);
      minLng = Math.min(minLng, c.lng);
      maxLng = Math.max(maxLng, c.lng);
    }
    return GeoUtils.distanceKm(new LatLng(minLat, minLng), new LatLng(maxLat, maxLng));
  }

  /**
   * Partial update — only non-null arguments are applied. Throws AccessDeniedException unless the
   * caller owns the map or holds MANAGE_MAPS (admin override, e.g. for ownerless legacy rows).
   */
  public GameMap updateMap(Long mapId, String name, Boolean isPublic, Double maxErrorDistanceKm, String description,
      User currentUser, boolean isAdmin) {
    GameMap map = getGameMap(mapId);
    if (map == null) {
      return null;
    }
    if (!isOwner(map, currentUser) && !isAdmin) {
      throw new AccessDeniedException("Not allowed to edit this map");
    }
    if (name != null) {
      String trimmedName = name.trim();
      if (trimmedName.isEmpty()) {
        throw new IllegalArgumentException("Map name is required");
      }
      map.setName(trimmedName);
    }
    if (isPublic != null) {
      map.setIsPublic(isPublic);
    }
    if (maxErrorDistanceKm != null) {
      validateMaxErrorDistance(maxErrorDistanceKm);
      map.setMaxErrorDistanceKm(maxErrorDistanceKm);
    }
    if (description != null) {
      map.setDescription(validateDescription(description));
    }
    return gameMapRepository.save(map);
  }

  /** Throws AccessDeniedException under the same rules as {@link #updateMap}. Returns false if not found. */
  public boolean deleteMap(Long mapId, User currentUser, boolean isAdmin) {
    GameMap map = getGameMap(mapId);
    if (map == null) {
      return false;
    }
    if (!isOwner(map, currentUser) && !isAdmin) {
      throw new AccessDeniedException("Not allowed to delete this map");
    }
    gameMapRepository.delete(map);
    favoriteMapRepository.deleteByMapId(mapId);
    deleteLocalFileIfAny(coordinatesRoot(), map.getJsonFileUrl());
    if (map.getImageUrl() != null && map.getImageUrl().startsWith("/uploads/images/")) {
      deleteLocalFileIfAny(imagesRoot(), map.getImageUrl().substring("/uploads/images/".length()));
    }
    return true;
  }

  // Best-effort cleanup: mirrors the rollback cleanup in uploadMap, but a failure here shouldn't
  // block the (already-committed) DB deletion — just leaves an orphaned file, logged for cleanup.
  private void deleteLocalFileIfAny(Path root, String relativePath) {
    if (relativePath == null || relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
      return;
    }
    try {
      Path path = root.resolve(relativePath).normalize();
      if (path.startsWith(root)) {
        Files.deleteIfExists(path);
      }
    } catch (IOException e) {
      log.warn("Failed to delete map file {}", relativePath, e);
    }
  }

  private void validateMaxErrorDistance(Double maxErrorDistanceKm) {
    if (maxErrorDistanceKm == null) {
      return;
    }
    if (maxErrorDistanceKm <= 0 || maxErrorDistanceKm > MAX_ERROR_DISTANCE_KM_LIMIT) {
      throw new IllegalArgumentException(
          "Boundary scale must be between 0 and " + (int) MAX_ERROR_DISTANCE_KM_LIMIT + " km");
    }
  }

  private String validateDescription(String description) {
    String trimmed = description == null ? "" : description.trim();
    if (trimmed.length() > MAX_DESCRIPTION_LENGTH) {
      throw new IllegalArgumentException("Description is too long (max " + MAX_DESCRIPTION_LENGTH + " characters)");
    }
    return trimmed;
  }

  private List<LatLng> validateCoordinates(byte[] coordinatesBytes) throws IOException {
    JsonNode root;
    try {
      root = objectMapper.readTree(coordinatesBytes);
    } catch (Exception e) {
      throw new IllegalArgumentException("Coordinates file is not valid JSON");
    }

    JsonNode coordsNode = root.path("customCoordinates");
    if (!coordsNode.isArray() || coordsNode.isEmpty()) {
      throw new IllegalArgumentException("Coordinates file must contain a non-empty \"customCoordinates\" array");
    }
    if (coordsNode.size() > MAX_COORDINATE_COUNT) {
      throw new IllegalArgumentException("Coordinates file has too many points (max " + MAX_COORDINATE_COUNT + ")");
    }

    List<LatLng> coordinates = new ArrayList<>();
    for (JsonNode node : coordsNode) {
      JsonNode latNode = node.path("lat");
      JsonNode lngNode = node.path("lng");
      if (!latNode.isNumber() || !lngNode.isNumber()) {
        throw new IllegalArgumentException("Every coordinate needs numeric \"lat\" and \"lng\"");
      }
      double lat = latNode.asDouble();
      double lng = lngNode.asDouble();
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new IllegalArgumentException("Coordinate out of range: (" + lat + ", " + lng + ")");
      }
      coordinates.add(new LatLng(lat, lng));
    }
    return coordinates;
  }

  private byte[] validateImage(MultipartFile imageFile) throws IOException {
    if (imageFile.getSize() > MAX_IMAGE_BYTES) {
      throw new IllegalArgumentException("Image is too large (max 5MB)");
    }
    String contentType = imageFile.getContentType();
    if (contentType == null || !ALLOWED_IMAGE_TYPES.containsKey(contentType)) {
      throw new IllegalArgumentException("Image must be JPEG, PNG, or WebP");
    }

    byte[] bytes = imageFile.getBytes();
    BufferedImage decoded;
    try {
      decoded = ImageIO.read(new ByteArrayInputStream(bytes));
    } catch (Exception e) {
      decoded = null;
    }
    if (decoded == null) {
      throw new IllegalArgumentException("File is not a readable image");
    }
    return bytes;
  }

  private Path coordinatesRoot() {
    return Path.of(uploadsDir, "coordinates").toAbsolutePath().normalize();
  }

  private Path imagesRoot() {
    return Path.of(uploadsDir, "images").toAbsolutePath().normalize();
  }
}
