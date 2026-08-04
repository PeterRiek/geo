package me.peterrk.pan.backend.exception;

import java.io.IOException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * Central error mapping so every endpoint returns the same {"error": "..."} JSON shape, instead of
 * each controller hand-rolling its own try/catch with an inconsistent body (plain string, JSON, or
 * Spring's default Whitelabel page for anything uncaught).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
    return error(HttpStatus.BAD_REQUEST, e.getMessage());
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException e) {
    return error(HttpStatus.BAD_REQUEST, "Invalid data");
  }

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<Map<String, String>> handleAuthentication(AuthenticationException e) {
    return error(HttpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException e) {
    return error(HttpStatus.FORBIDDEN, "Access denied");
  }

  @ExceptionHandler(UsernameAlreadyExistsException.class)
  public ResponseEntity<Map<String, String>> handleUsernameConflict(UsernameAlreadyExistsException e) {
    return error(HttpStatus.CONFLICT, e.getMessage());
  }

  @ExceptionHandler(InvalidActivationKeyException.class)
  public ResponseEntity<Map<String, String>> handleInvalidActivationKey(InvalidActivationKeyException e) {
    return error(HttpStatus.BAD_REQUEST, e.getMessage());
  }

  @ExceptionHandler(UsernameNotFoundException.class)
  public ResponseEntity<Map<String, String>> handleNotFound(UsernameNotFoundException e) {
    return error(HttpStatus.NOT_FOUND, e.getMessage());
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<Map<String, String>> handleTooLarge(MaxUploadSizeExceededException e) {
    return error(HttpStatus.PAYLOAD_TOO_LARGE, "Uploaded file is too large");
  }

  @ExceptionHandler(IOException.class)
  public ResponseEntity<Map<String, String>> handleIOException(IOException e) {
    log.error("Unhandled IO error", e);
    return error(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to process request");
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> handleGeneric(Exception e) {
    log.error("Unhandled exception", e);
    return error(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
  }

  private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(Map.of("error", message));
  }
}
