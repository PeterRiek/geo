package me.peterrk.pan.backend.repository;

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
}
