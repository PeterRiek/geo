package me.peterrk.pan.backend.service;

import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.GameSessionRepository;
import me.peterrk.pan.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private GameSessionRepository gameSessionRepository;

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
    int playedToday = gameSessionRepository.countTodayByUser(user, startOfDay, startOfNextDay);

    boolean hasUnlimitedPlay = hasPermission(user, "PLAY_UNLIMITED");

    int maxGamesPerDay = hasUnlimitedPlay ? -1 : 5;
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
}
