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

  @Column(name = "json_file_url", unique = true, nullable = false)
  private String jsonFileUrl;

  public GameMap() {
  }

  public GameMap(String name, String jsonFileUrl) {
    this.name = name;
    this.jsonFileUrl = jsonFileUrl;
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
}
