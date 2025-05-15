package me.peterrk.pan.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import jakarta.transaction.Transactional;
import me.peterrk.pan.backend.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByUsername(String username);

  @Transactional
  int deleteByUsername(String username);
}
