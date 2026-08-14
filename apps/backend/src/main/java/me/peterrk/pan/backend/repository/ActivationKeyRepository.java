package me.peterrk.pan.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import me.peterrk.pan.backend.model.ActivationKey;

public interface ActivationKeyRepository extends JpaRepository<ActivationKey, Long> {
  Optional<ActivationKey> findByCode(String code);
}
