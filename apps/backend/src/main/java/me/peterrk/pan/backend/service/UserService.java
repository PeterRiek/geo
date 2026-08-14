package me.peterrk.pan.backend.service;

import me.peterrk.pan.backend.exception.UsernameAlreadyExistsException;
import me.peterrk.pan.backend.model.Permission;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.GameSessionPlayerRepository;
import me.peterrk.pan.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

  // -1 means unlimited. When a user holds permissions from more than one tier (e.g. two
  // activation keys redeemed), the most permissive one wins.
  private static final Map<String, Integer> TIER_DAILY_LIMITS = Map.of(
      "PLAY_UNLIMITED", -1,
      "PLAY_100_PER_DAY", 100);

  private final UserRepository userRepository;
  private final GameSessionPlayerRepository gameSessionPlayerRepository;

  @Value("${app.game.daily-limit:5}")
  private int dailyLimit;

  public UserService(UserRepository userRepository, GameSessionPlayerRepository gameSessionPlayerRepository) {
    this.userRepository = userRepository;
    this.gameSessionPlayerRepository = gameSessionPlayerRepository;
  }

  public User getAuthenticatedUser(String username) {
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }

  private int resolveMaxGamesPerDay(User user) {
    Set<String> permissionNames = user.getRoles().stream()
        .flatMap(role -> role.getPermissions().stream())
        .map(Permission::getName)
        .collect(Collectors.toSet());

    int max = dailyLimit;
    boolean hasTier = false;
    for (Map.Entry<String, Integer> tier : TIER_DAILY_LIMITS.entrySet()) {
      if (!permissionNames.contains(tier.getKey())) {
        continue;
      }
      int limit = tier.getValue();
      if (!hasTier) {
        max = limit;
        hasTier = true;
      } else if (limit == -1 || max == -1) {
        max = -1;
      } else {
        max = Math.max(max, limit);
      }
    }
    return max;
  }

  public Map<String, Object> getPlayPermissionStatus(User user) {
    LocalDate today = LocalDate.now();
    LocalDateTime startOfDay = today.atStartOfDay();
    LocalDateTime startOfNextDay = today.plusDays(1).atStartOfDay();
    int playedToday = gameSessionPlayerRepository.countTodayByUser(user, startOfDay, startOfNextDay);

    int maxGamesPerDay = resolveMaxGamesPerDay(user);
    boolean canPlay = maxGamesPerDay == -1 || playedToday < maxGamesPerDay;

    Map<String, Object> response = new HashMap<>();
    response.put("canPlay", canPlay);
    response.put("gamesPlayedToday", playedToday);
    response.put("maxGamesPerDay", maxGamesPerDay);

    return response;
  }

  public List<User> getAllUsers() {
    return userRepository.findAll();
  }

  /**
   * Throws IllegalArgumentException for an empty/blank username and UsernameAlreadyExistsException
   * if another user already has it. A no-op change (same username) is allowed through.
   */
  public User updateUsername(User user, String newUsername) {
    String trimmed = newUsername == null ? "" : newUsername.trim();
    if (trimmed.isEmpty()) {
      throw new IllegalArgumentException("Username is required");
    }
    if (!trimmed.equals(user.getUsername()) && userRepository.findByUsername(trimmed).isPresent()) {
      throw new UsernameAlreadyExistsException("Username already exists");
    }
    user.setUsername(trimmed);
    return userRepository.save(user);
  }
}
