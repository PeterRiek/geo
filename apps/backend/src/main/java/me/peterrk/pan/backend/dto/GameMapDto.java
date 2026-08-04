package me.peterrk.pan.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import me.peterrk.pan.backend.model.GameMap;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.util.GeoUtils;

/**
 * Never serialize a {@link GameMap} entity directly — it carries a {@code User owner} association
 * that would leak the owner's password hash over JSON. This DTO also resolves the nullable
 * visibility/scoring fields to their effective values so the frontend never has to special-case null.
 */
public class GameMapDto {

  private final Long id;
  private final String name;
  private final String imageUrl;
  private final String description;
  private final String ownerUsername;
  private final boolean isPublic;
  private final boolean isOwn;
  private final double maxErrorDistanceKm;
  private final int locationCount;

  // locationCount is passed in explicitly rather than resolved here — resolving it can require
  // parsing the coordinates file and persisting a backfilled count, which doesn't belong inside a
  // DTO constructor. See GameMapService#resolveLocationCount.
  public GameMapDto(GameMap map, User currentUser, int locationCount) {
    this.id = map.getId();
    this.name = map.getName();
    this.imageUrl = map.getImageUrl();
    this.description = map.getDescription() != null ? map.getDescription() : "";
    this.ownerUsername = map.getOwner() != null ? map.getOwner().getUsername() : null;
    this.isPublic = map.getIsPublic() == null || map.getIsPublic();
    this.isOwn = map.getOwner() != null && currentUser != null
        && map.getOwner().getId().equals(currentUser.getId());
    this.maxErrorDistanceKm = map.getMaxErrorDistanceKm() != null
        ? map.getMaxErrorDistanceKm()
        : GeoUtils.DEFAULT_MAX_ERROR_DISTANCE_KM;
    this.locationCount = locationCount;
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public String getDescription() {
    return description;
  }

  public String getOwnerUsername() {
    return ownerUsername;
  }

  // Explicit @JsonProperty: Jackson's default bean-property naming strips the "is" prefix from
  // isXxx() getters (isPublic() -> "public"), which would collide with the "public" Java keyword
  // on the frontend/be a surprising wire name — pin it to isPublic/isOwn instead.
  @JsonProperty("isPublic")
  public boolean isPublic() {
    return isPublic;
  }

  @JsonProperty("isOwn")
  public boolean isOwn() {
    return isOwn;
  }

  public double getMaxErrorDistanceKm() {
    return maxErrorDistanceKm;
  }

  public int getLocationCount() {
    return locationCount;
  }
}
