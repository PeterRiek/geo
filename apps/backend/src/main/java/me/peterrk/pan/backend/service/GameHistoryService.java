package me.peterrk.pan.backend.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import me.peterrk.pan.backend.dto.GameSessionDetail;
import me.peterrk.pan.backend.dto.GameSessionSummary;
import me.peterrk.pan.backend.dto.GameSettings;
import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.dto.ws.RoomState;
import me.peterrk.pan.backend.model.GameGuess;
import me.peterrk.pan.backend.model.GameMap;
import me.peterrk.pan.backend.model.GameRound;
import me.peterrk.pan.backend.model.GameSession;
import me.peterrk.pan.backend.model.GameSessionPlayer;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.GameGuessRepository;
import me.peterrk.pan.backend.repository.GameMapRepository;
import me.peterrk.pan.backend.repository.GameRoundRepository;
import me.peterrk.pan.backend.repository.GameSessionPlayerRepository;
import me.peterrk.pan.backend.repository.GameSessionRepository;
import me.peterrk.pan.backend.repository.UserRepository;

/**
 * Writes a finished room to the database as a results record. This is the only place game data
 * is persisted — live play stays entirely in {@link GameService}'s in-memory RoomState, so a room
 * that never finishes leaves no trace here.
 */
@Service
public class GameHistoryService {

  private final UserRepository userRepository;
  private final GameSessionRepository gameSessionRepository;
  private final GameSessionPlayerRepository gameSessionPlayerRepository;
  private final GameRoundRepository gameRoundRepository;
  private final GameGuessRepository gameGuessRepository;
  private final GameMapRepository gameMapRepository;

  public GameHistoryService(UserRepository userRepository, GameSessionRepository gameSessionRepository,
      GameSessionPlayerRepository gameSessionPlayerRepository, GameRoundRepository gameRoundRepository,
      GameGuessRepository gameGuessRepository, GameMapRepository gameMapRepository) {
    this.userRepository = userRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.gameSessionPlayerRepository = gameSessionPlayerRepository;
    this.gameRoundRepository = gameRoundRepository;
    this.gameGuessRepository = gameGuessRepository;
    this.gameMapRepository = gameMapRepository;
  }

  @Transactional
  public void persistCompletedSession(RoomState room) {
    if (room.players == null || room.players.isEmpty() || room.allTargets == null) {
      return;
    }

    User creator = (room.creatorUsername != null ? userRepository.findByUsername(room.creatorUsername) : null)
        .or(() -> userRepository.findByUsername(room.players.get(0)))
        .orElse(null);
    if (creator == null) {
      return;
    }

    GameSettings settings = room.roomSettings;
    GameSession session = new GameSession(creator);
    session.setMode(settings.gameMode == GameSettings.GameMode.SINGLEPLAYER
        ? GameSession.Mode.SINGLEPLAYER
        : GameSession.Mode.MULTIPLAYER);
    session.setMapId(settings.mapId);
    session.setRoundCount(settings.roundCount);
    session.setRoundTimeLimitSeconds(settings.roundTimeLimitSeconds);
    session.setAllowMove(settings.allowMove);
    session.setAllowZoom(settings.allowZoom);
    session.setAllowPan(settings.allowPan);
    session.setFinishedAt(LocalDateTime.now());
    session = gameSessionRepository.save(session);

    Map<String, GameSessionPlayer> playersByUsername = new HashMap<>();
    for (String username : room.players) {
      User user = userRepository.findByUsername(username).orElse(null);
      if (user == null) {
        continue;
      }
      playersByUsername.put(username, gameSessionPlayerRepository.save(new GameSessionPlayer(session, user, 0)));
    }
    if (playersByUsername.isEmpty()) {
      return;
    }

    for (int roundIndex = 0; roundIndex < room.allTargets.size(); roundIndex++) {
      LatLng target = room.allTargets.get(roundIndex);
      GameRound round = gameRoundRepository.save(new GameRound(session, roundIndex, target.lat, target.lng));

      Map<String, LatLng> guesses = room.allGuesses != null && roundIndex < room.allGuesses.size()
          ? room.allGuesses.get(roundIndex)
          : Map.of();
      Map<String, Double> distances = room.allDistances != null && roundIndex < room.allDistances.size()
          ? room.allDistances.get(roundIndex)
          : Map.of();
      Map<String, Integer> scores = room.allScores != null && roundIndex < room.allScores.size()
          ? room.allScores.get(roundIndex)
          : Map.of();

      for (Map.Entry<String, GameSessionPlayer> entry : playersByUsername.entrySet()) {
        LatLng guess = guesses.get(entry.getKey());
        GameSessionPlayer player = entry.getValue();

        Double distanceKm = guess != null ? distances.get(entry.getKey()) : null;
        int score = guess != null ? scores.getOrDefault(entry.getKey(), 0) : 0;

        gameGuessRepository.save(new GameGuess(round, player,
            guess != null ? guess.lat : null, guess != null ? guess.lng : null,
            distanceKm, score, guess == null));

        player.setTotalScore(player.getTotalScore() + score);
      }
    }

    gameSessionPlayerRepository.saveAll(playersByUsername.values());
  }

  public Page<GameSessionSummary> getHistory(User user, Pageable pageable) {
    return gameSessionPlayerRepository.findByUserOrderBySessionFinishedAtDesc(user, pageable)
        .map(gsp -> {
          GameSession session = gsp.getSession();
          GameSessionSummary summary = new GameSessionSummary();
          summary.id = session.getId();
          summary.mode = session.getMode();
          summary.mapId = session.getMapId();
          if (session.getMapId() != null) {
            GameMap map = gameMapRepository.findById(session.getMapId()).orElse(null);
            if (map != null) {
              summary.mapName = map.getName();
              summary.mapImageUrl = map.getImageUrl();
            }
          }
          summary.roundCount = session.getRoundCount();
          summary.finishedAt = session.getFinishedAt();
          summary.yourScore = gsp.getTotalScore();
          summary.otherPlayers = gameSessionPlayerRepository.findBySessionId(session.getId()).stream()
              .map(p -> p.getUser().getUsername())
              .filter(name -> !name.equals(user.getUsername()))
              .toList();
          return summary;
        });
  }

  /** Returns null if the session doesn't exist or the given user wasn't a participant. */
  public GameSessionDetail getDetail(User user, Long sessionId) {
    List<GameSessionPlayer> players = gameSessionPlayerRepository.findBySessionId(sessionId);
    boolean isParticipant = players.stream().anyMatch(p -> p.getUser().getId().equals(user.getId()));
    if (!isParticipant || players.isEmpty()) {
      return null;
    }
    GameSession session = players.get(0).getSession();

    List<GameRound> rounds = gameRoundRepository.findBySessionIdOrderByRoundIndex(sessionId);
    List<GameGuess> guesses = gameGuessRepository.findByRoundIdIn(rounds.stream().map(GameRound::getId).toList());
    Map<Long, List<GameGuess>> guessesByRound = guesses.stream()
        .collect(Collectors.groupingBy(g -> g.getRound().getId()));

    GameSessionDetail detail = new GameSessionDetail();
    detail.id = session.getId();
    detail.mode = session.getMode();
    detail.mapId = session.getMapId();
    detail.roundCount = session.getRoundCount();
    detail.roundTimeLimitSeconds = session.getRoundTimeLimitSeconds();
    detail.finishedAt = session.getFinishedAt();
    detail.players = players.stream().map(p -> {
      GameSessionDetail.PlayerResult result = new GameSessionDetail.PlayerResult();
      result.username = p.getUser().getUsername();
      result.totalScore = p.getTotalScore();
      return result;
    }).toList();
    detail.rounds = rounds.stream().map(round -> {
      GameSessionDetail.RoundResult roundResult = new GameSessionDetail.RoundResult();
      roundResult.roundIndex = round.getRoundIndex();
      roundResult.targetLat = round.getTargetLat();
      roundResult.targetLng = round.getTargetLng();
      roundResult.guesses = guessesByRound.getOrDefault(round.getId(), List.of()).stream().map(g -> {
        GameSessionDetail.GuessResult guessResult = new GameSessionDetail.GuessResult();
        guessResult.username = g.getPlayer().getUser().getUsername();
        guessResult.lat = g.getLat();
        guessResult.lng = g.getLng();
        guessResult.distanceKm = g.getDistanceKm();
        guessResult.score = g.getScore();
        guessResult.timedOut = g.isTimedOut();
        return guessResult;
      }).toList();
      return roundResult;
    }).toList();

    return detail;
  }
}
