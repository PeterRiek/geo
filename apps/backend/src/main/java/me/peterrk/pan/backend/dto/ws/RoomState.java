package me.peterrk.pan.backend.dto.ws;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import me.peterrk.pan.backend.dto.GameSettings;

public class RoomState {
  public static enum RoomPhase {
    WAITING, ROUND_IN_PROGRESS, ROUND_RESULTS, GAME_RESULTS;
  }

  public String roomId;
  public GameSettings roomSettings;
  public RoomPhase roomPhase;
  // Username of whoever sent CREATE — recorded as the session's owner in history.
  public String creatorUsername;

  public List<LatLng> allTargets;
  public List<Map<String, LatLng>> allGuesses;
  public int roundCount;
  public List<String> players = new ArrayList<>();

  // Epoch millis the current round's guess window closes. Sent to clients for
  // the countdown; the server (not the client) is what actually resolves it.
  public Long roundEndsAt;
  // Usernames that are still room members but have no live socket right now.
  public Set<String> disconnectedPlayers = new HashSet<>();
}
