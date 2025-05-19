package me.peterrk.pan.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.model.GameMap;
import me.peterrk.pan.backend.repository.GameMapRepository;

@Service
public class GameMapService {

  @Autowired
  private GameMapRepository gameMapRepository;

  @Autowired
  private RestTemplate restTemplate;

  private final ObjectMapper objectMapper = new ObjectMapper();

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
      String jsonData = restTemplate.getForObject(gameMap.getJsonFileUrl(), String.class);
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
    } catch (Exception e) {
      return List.of();
    }
  }
}
