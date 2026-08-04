package me.peterrk.pan.backend.repository;

import java.util.List;

import me.peterrk.pan.backend.model.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

  // Every row here is already a completed game (GameHistoryService only persists on finish), so a
  // plain count-per-mapId is exactly "times played to completion" — no finishedAt filter needed.
  @Query("SELECT s.mapId, COUNT(s) FROM GameSession s WHERE s.mapId IS NOT NULL GROUP BY s.mapId")
  List<Object[]> countSessionsByMapId();
}
