package me.peterrk.pan.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

// Plain Long columns rather than @ManyToOne associations (mirrors GameSession#mapId) — keeps this
// table free of FK constraints so deleting a map or user never fails on an orphaned favorite row;
// GameMapService#deleteMap explicitly purges rows here instead.
@Entity
@Table(name = "favorite_maps")
@IdClass(FavoriteMapId.class)
public class FavoriteMap {

  @Id
  @Column(name = "user_id")
  private Long userId;

  @Id
  @Column(name = "map_id")
  private Long mapId;

  public FavoriteMap() {
  }

  public FavoriteMap(Long userId, Long mapId) {
    this.userId = userId;
    this.mapId = mapId;
  }

  public Long getUserId() {
    return userId;
  }

  public void setUserId(Long userId) {
    this.userId = userId;
  }

  public Long getMapId() {
    return mapId;
  }

  public void setMapId(Long mapId) {
    this.mapId = mapId;
  }
}
