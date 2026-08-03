package me.peterrk.pan.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import me.peterrk.pan.backend.model.GameRound;

@Repository
public interface GameRoundRepository extends JpaRepository<GameRound, Long> {

  List<GameRound> findBySessionIdOrderByRoundIndex(Long sessionId);
}
