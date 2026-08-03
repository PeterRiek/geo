package me.peterrk.pan.backend.repository;

import me.peterrk.pan.backend.model.GameSession;
import me.peterrk.pan.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

  @Query("SELECT COUNT(gs) FROM GameSession gs WHERE gs.user = :user AND gs.mode = me.peterrk.pan.backend.model.GameSession.Mode.SINGLEPLAYER AND gs.playedAt >= :startOfDay AND gs.playedAt < :startOfNextDay")
  int countTodayByUser(User user, LocalDateTime startOfDay, LocalDateTime startOfNextDay);

}
