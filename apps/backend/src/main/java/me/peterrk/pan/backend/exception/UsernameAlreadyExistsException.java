package me.peterrk.pan.backend.exception;

/** Thrown when a username change targets a username already taken by another user. */
public class UsernameAlreadyExistsException extends RuntimeException {
  public UsernameAlreadyExistsException(String message) {
    super(message);
  }
}
