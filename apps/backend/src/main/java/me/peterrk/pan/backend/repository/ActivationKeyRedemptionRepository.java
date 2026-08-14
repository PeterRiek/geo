package me.peterrk.pan.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import me.peterrk.pan.backend.model.ActivationKey;
import me.peterrk.pan.backend.model.ActivationKeyRedemption;
import me.peterrk.pan.backend.model.User;

public interface ActivationKeyRedemptionRepository extends JpaRepository<ActivationKeyRedemption, Long> {
  boolean existsByActivationKeyAndUser(ActivationKey activationKey, User user);
}
