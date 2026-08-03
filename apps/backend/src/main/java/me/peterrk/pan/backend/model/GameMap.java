package me.peterrk.pan.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "game_maps")
public class GameMap {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false)
  private String name;

  // For maps uploaded via /api/gamemap, this is a path relative to the uploads
  // dir (read directly off disk). For older/external maps it's a full URL,
  // fetched over HTTP — see GameMapService#getCustomCoordinates.
  @Column(name = "json_file_url", unique = true, nullable = false)
  private String jsonFileUrl;

  @Column(name = "image_url")
  private String imageUrl;

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
}
