package me.peterrk.pan.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import me.peterrk.pan.backend.model.GameGuess;

@Repository
public interface GameGuessRepository extends JpaRepository<GameGuess, Long> {

  List<GameGuess> findByRoundIdIn(List<Long> roundIds);
}
