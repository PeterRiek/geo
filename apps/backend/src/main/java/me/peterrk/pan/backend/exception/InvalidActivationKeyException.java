package me.peterrk.pan.backend.exception;

/** Thrown when an activation key code is unknown, revoked, expired, exhausted, or already redeemed by the caller. */
public class InvalidActivationKeyException extends RuntimeException {
  public InvalidActivationKeyException(String message) {
    super(message);
  }
}
