package me.peterrk.pan.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import me.peterrk.pan.backend.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);
}
