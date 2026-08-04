package me.peterrk.pan.backend.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import me.peterrk.pan.backend.exception.InvalidActivationKeyException;
import me.peterrk.pan.backend.model.ActivationKey;
import me.peterrk.pan.backend.model.ActivationKeyRedemption;
import me.peterrk.pan.backend.model.Role;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.ActivationKeyRedemptionRepository;
import me.peterrk.pan.backend.repository.ActivationKeyRepository;
import me.peterrk.pan.backend.repository.UserRepository;

@Service
public class ActivationKeyService {

  // Excludes visually ambiguous characters (0/O, 1/I) since codes are hand-typed.
  private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  private static final int CODE_LENGTH = 16;
  private static final int CODE_GROUP_SIZE = 4;

  private final SecureRandom random = new SecureRandom();

  private final ActivationKeyRepository activationKeyRepository;
  private final ActivationKeyRedemptionRepository redemptionRepository;
  private final UserRepository userRepository;

  public ActivationKeyService(
      ActivationKeyRepository activationKeyRepository,
      ActivationKeyRedemptionRepository redemptionRepository,
      UserRepository userRepository) {
    this.activationKeyRepository = activationKeyRepository;
    this.redemptionRepository = redemptionRepository;
    this.userRepository = userRepository;
  }

  public ActivationKey generateKey(Role role, int maxUses, LocalDateTime expiresAt, User createdBy) {
    if (maxUses < 1) {
      throw new IllegalArgumentException("maxUses must be at least 1");
    }

    String code;
    do {
      code = generateCode();
    } while (activationKeyRepository.findByCode(code).isPresent());

    return activationKeyRepository.save(new ActivationKey(code, role, maxUses, expiresAt, createdBy));
  }

  @Transactional
  public User redeemKey(User user, String rawCode) {
    String normalized = rawCode == null ? "" : rawCode.trim().toUpperCase().replace("-", "");
    if (normalized.isEmpty()) {
      throw new InvalidActivationKeyException("Activation key is required");
    }

    ActivationKey key = activationKeyRepository.findByCode(formatCode(normalized))
        .orElseThrow(() -> new InvalidActivationKeyException("Invalid activation key"));

    if (key.isRevoked()) {
      throw new InvalidActivationKeyException("This activation key has been revoked");
    }
    if (key.getExpiresAt() != null && key.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new InvalidActivationKeyException("This activation key has expired");
    }
    if (key.getUseCount() >= key.getMaxUses()) {
      throw new InvalidActivationKeyException("This activation key has already been fully redeemed");
    }
    if (redemptionRepository.existsByActivationKeyAndUser(key, user)) {
      throw new InvalidActivationKeyException("You have already redeemed this activation key");
    }

    // Role has no equals/hashCode override, so guard against adding a second Role instance for a
    // role the user already holds — Hibernate would otherwise insert a duplicate join-table row.
    boolean alreadyHasRole = user.getRoles().stream()
        .anyMatch(r -> r.getId().equals(key.getRole().getId()));
    if (!alreadyHasRole) {
      user.getRoles().add(key.getRole());
    }
    User saved = userRepository.save(user);

    redemptionRepository.save(new ActivationKeyRedemption(key, user));
    key.setUseCount(key.getUseCount() + 1);
    activationKeyRepository.save(key);

    return saved;
  }

  public List<ActivationKey> listKeys() {
    return activationKeyRepository.findAll();
  }

  public ActivationKey revokeKey(Long id) {
    ActivationKey key = activationKeyRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Activation key not found"));
    key.setRevoked(true);
    return activationKeyRepository.save(key);
  }

  private String generateCode() {
    StringBuilder raw = new StringBuilder(CODE_LENGTH);
    for (int i = 0; i < CODE_LENGTH; i++) {
      raw.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
    }
    return formatCode(raw.toString());
  }

  private String formatCode(String raw) {
    StringBuilder formatted = new StringBuilder();
    for (int i = 0; i < raw.length(); i++) {
      if (i > 0 && i % CODE_GROUP_SIZE == 0) {
        formatted.append('-');
      }
      formatted.append(raw.charAt(i));
    }
    return formatted.toString();
  }
}
