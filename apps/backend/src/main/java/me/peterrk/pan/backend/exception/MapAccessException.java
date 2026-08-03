package me.peterrk.pan.backend.exception;

/** Thrown when a WS room-creation request references a map the requester can't access. */
public class MapAccessException extends RuntimeException {
  public MapAccessException(String message) {
    super(message);
  }
}
