package me.peterrk.pan.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.transaction.Transactional;
import me.peterrk.pan.backend.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByUsername(String username);

  @Transactional
  int deleteByUsername(String username);

  @Query("SELECT u FROM User u " +
      "LEFT JOIN FETCH u.roles r " +
      "LEFT JOIN FETCH r.permissions " +
      "WHERE u.username = :username")
  Optional<User> findByUsernameFetchRolesAndPermissions(@Param("username") String username);
}
