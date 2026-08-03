package me.peterrk.pan.backend.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.model.GameMap;
import me.peterrk.pan.backend.repository.GameMapRepository;

@Service
public class GameMapService {

  private static final int MAX_COORDINATE_COUNT = 20_000;
  private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
  // Limited to formats the JDK's built-in ImageIO can decode (used below to verify the upload is
  // a genuine image, not just a file with a spoofed content-type) — no webp plugin on the classpath.
  private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of(
      "image/jpeg", "jpg",
      "image/png", "png");

  private final GameMapRepository gameMapRepository;
  private final RestTemplate restTemplate;

  @Value("${app.uploads.dir:uploads}")
  private String uploadsDir;

  private final ObjectMapper objectMapper = new ObjectMapper();

  public GameMapService(GameMapRepository gameMapRepository, RestTemplate restTemplate) {
    this.gameMapRepository = gameMapRepository;
    this.restTemplate = restTemplate;
  }

  public GameMap getGameMap(Long id) {
    return gameMapRepository.findById(id).orElse(null);
  }

  public GameMap getGameMap(String name) {
    return gameMapRepository.findByName(name).orElse(null);
  }

  public List<GameMap> getAllGameMaps() {
    return gameMapRepository.findAll();
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
  public GameMap uploadMap(String name, MultipartFile coordinatesFile, MultipartFile imageFile) throws IOException {
    String trimmedName = name == null ? "" : name.trim();
    if (trimmedName.isEmpty()) {
      throw new IllegalArgumentException("Map name is required");
    }
    if (gameMapRepository.findByName(trimmedName).isPresent()) {
      throw new IllegalArgumentException("A map named \"" + trimmedName + "\" already exists");
    }
    if (coordinatesFile == null || coordinatesFile.isEmpty()) {
      throw new IllegalArgumentException("A coordinates JSON file is required");
    }
    if (imageFile == null || imageFile.isEmpty()) {
      throw new IllegalArgumentException("A preview image is required");
    }

    byte[] coordinatesBytes = coordinatesFile.getBytes();
    validateCoordinates(coordinatesBytes);

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
      return gameMapRepository.save(gameMap);
    } catch (Exception e) {
      Files.deleteIfExists(coordinatesPath);
      Files.deleteIfExists(imagePath);
      throw e;
    }
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
