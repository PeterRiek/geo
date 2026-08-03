package me.peterrk.pan.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Force-resolves any room whose current round has run past its time limit —
 * this is what makes the round time limit apply even if nobody guesses
 * (including a disconnected player, who otherwise has no other grace period;
 * see GameService#resolveExpiredRounds).
 */
@Component
public class RoundTimeoutScheduler {

  private final GameService gameService;

  public RoundTimeoutScheduler(GameService gameService) {
    this.gameService = gameService;
  }

  @Scheduled(fixedDelay = 1000)
  public void checkExpiredRounds() {
    gameService.resolveExpiredRounds();
  }
}
