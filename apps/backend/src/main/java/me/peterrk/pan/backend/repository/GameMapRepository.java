package me.peterrk.pan.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import me.peterrk.pan.backend.model.GameMap;

public interface GameMapRepository extends JpaRepository<GameMap, Long> {

  @Query("SELECT m FROM GameMap m WHERE m.isPublic IS NULL OR m.isPublic = true "
      + "OR (m.owner IS NOT NULL AND m.owner.id = :userId)")
  List<GameMap> findVisibleTo(@Param("userId") Long userId);

}
