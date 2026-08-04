package me.peterrk.pan.backend.service;

import me.peterrk.pan.backend.exception.UsernameAlreadyExistsException;
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

@Service
public class UserService {

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

  private boolean hasPermission(User user, String permissionName) {
    return user.getRoles().stream()
        .flatMap(role -> role.getPermissions().stream())
        .anyMatch(permission -> permission.getName().equalsIgnoreCase(permissionName));
  }

  public Map<String, Object> getPlayPermissionStatus(User user) {
    LocalDate today = LocalDate.now();
    LocalDateTime startOfDay = today.atStartOfDay();
    LocalDateTime startOfNextDay = today.plusDays(1).atStartOfDay();
    int playedToday = gameSessionPlayerRepository.countTodayByUser(user, startOfDay, startOfNextDay);

    boolean hasUnlimitedPlay = hasPermission(user, "PLAY_UNLIMITED");

    int maxGamesPerDay = hasUnlimitedPlay ? -1 : dailyLimit;
    boolean canPlay = hasUnlimitedPlay || playedToday < maxGamesPerDay;

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
