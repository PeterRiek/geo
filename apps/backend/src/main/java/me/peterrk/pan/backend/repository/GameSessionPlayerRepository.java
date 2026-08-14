package me.peterrk.pan.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import me.peterrk.pan.backend.model.GameSessionPlayer;
import me.peterrk.pan.backend.model.User;

@Repository
public interface GameSessionPlayerRepository extends JpaRepository<GameSessionPlayer, Long> {

  @Query("SELECT gsp FROM GameSessionPlayer gsp WHERE gsp.user = :user ORDER BY gsp.session.finishedAt DESC")
  Page<GameSessionPlayer> findByUserOrderBySessionFinishedAtDesc(User user, Pageable pageable);

  List<GameSessionPlayer> findBySessionId(Long sessionId);

  // One row per participant per session (regardless of who created the room), so this counts
  // every game a user actually played today, singleplayer or multiplayer, creator or joiner —
  // the frontend's daily-limit gate (apps/web/src/middleware.ts) applies to both /game/play/sp
  // and /game/play/mp.
  @Query("SELECT COUNT(gsp) FROM GameSessionPlayer gsp WHERE gsp.user = :user "
      + "AND gsp.session.playedAt >= :startOfDay AND gsp.session.playedAt < :startOfNextDay")
  int countTodayByUser(User user, LocalDateTime startOfDay, LocalDateTime startOfNextDay);
}
