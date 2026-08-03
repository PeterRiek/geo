package me.peterrk.pan.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "game_maps")
public class GameMap {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  // For maps uploaded via /api/gamemap, this is a path relative to the uploads
  // dir (read directly off disk). For older/external maps it's a full URL,
  // fetched over HTTP — see GameMapService#getCustomCoordinates.
  @Column(name = "json_file_url", nullable = false)
  private String jsonFileUrl;

  @Column(name = "image_url")
  private String imageUrl;

  // Nullable: no migration tooling in this project (ddl-auto: update only), so a NOT NULL column
  // added here would fail Hibernate's auto-alter against pre-existing rows. Null means "no owner"
  // (a legacy/system map) — treated as public and only editable by MANAGE_MAPS holders.
  @ManyToOne
  @JoinColumn(name = "owner_id")
  private User owner;

  // Nullable Boolean (not primitive) for the same reason. Null is treated as public — preserves
  // pre-existing rows' "visible/playable by everyone" behavior. See GameMapService#isEffectivelyPublic.
  @Column(name = "is_public")
  private Boolean isPublic;

  // Nullable for the same reason; null falls back to GeoUtils.DEFAULT_MAX_ERROR_DISTANCE_KM at
  // score time. See GameMapService#uploadMap for the validated (0, 20_000] range on new values.
  @Column(name = "max_error_distance_km")
  private Double maxErrorDistanceKm;

  public GameMap() {
  }

  public GameMap(String name, String jsonFileUrl) {
    this.name = name;
    this.jsonFileUrl = jsonFileUrl;
  }

  public GameMap(String name, String jsonFileUrl, String imageUrl) {
    this.name = name;
    this.jsonFileUrl = jsonFileUrl;
    this.imageUrl = imageUrl;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getJsonFileUrl() {
    return jsonFileUrl;
  }

  public void setJsonFileUrl(String jsonFileUrl) {
    this.jsonFileUrl = jsonFileUrl;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public User getOwner() {
    return owner;
  }

  public void setOwner(User owner) {
    this.owner = owner;
  }

  public Boolean getIsPublic() {
    return isPublic;
  }

  public void setIsPublic(Boolean isPublic) {
    this.isPublic = isPublic;
  }

  public Double getMaxErrorDistanceKm() {
    return maxErrorDistanceKm;
  }

  public void setMaxErrorDistanceKm(Double maxErrorDistanceKm) {
    this.maxErrorDistanceKm = maxErrorDistanceKm;
  }
}
