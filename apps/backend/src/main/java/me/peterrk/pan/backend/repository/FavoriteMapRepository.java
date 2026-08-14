package me.peterrk.pan.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.transaction.Transactional;
import me.peterrk.pan.backend.model.FavoriteMap;
import me.peterrk.pan.backend.model.FavoriteMapId;

public interface FavoriteMapRepository extends JpaRepository<FavoriteMap, FavoriteMapId> {

  boolean existsByUserIdAndMapId(Long userId, Long mapId);

  @Transactional
  void deleteByUserIdAndMapId(Long userId, Long mapId);

  @Transactional
  void deleteByMapId(Long mapId);

  @Query("SELECT f.mapId FROM FavoriteMap f WHERE f.userId = :userId")
  List<Long> findMapIdsByUserId(@Param("userId") Long userId);

}
