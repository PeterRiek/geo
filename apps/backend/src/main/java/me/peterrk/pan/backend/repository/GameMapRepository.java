package me.peterrk.pan.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import me.peterrk.pan.backend.model.GameMap;

public interface GameMapRepository extends JpaRepository<GameMap, Long>{
  
  Optional<GameMap> findByName(String name);

  
}