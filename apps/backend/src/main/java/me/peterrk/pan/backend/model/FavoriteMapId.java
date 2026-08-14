package me.peterrk.pan.backend.model;

import java.io.Serializable;
import java.util.Objects;

/** Composite primary key for {@link FavoriteMap}. */
public class FavoriteMapId implements Serializable {

  private Long userId;
  private Long mapId;

  public FavoriteMapId() {
  }

  public FavoriteMapId(Long userId, Long mapId) {
    this.userId = userId;
    this.mapId = mapId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (!(o instanceof FavoriteMapId))
      return false;
    FavoriteMapId that = (FavoriteMapId) o;
    return Objects.equals(userId, that.userId) && Objects.equals(mapId, that.mapId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(userId, mapId);
  }
}
