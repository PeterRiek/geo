package me.peterrk.pan.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.UserRepository;

@RestController
@RequestMapping("/debug")
public class DebugController {

  private final UserRepository userRepository;

  public DebugController(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @GetMapping("/status")
  public String getStatus() {
    return "Up and Running";
  }

  @GetMapping("/users")
  public List<User> getAllUsers() {
    List<User> users = userRepository.findAll();
    users.forEach(user -> System.out.println(user.getEmail() + " - " + user.getName()));
    return users;
  }

}
