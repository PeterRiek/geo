package me.peterrk.pan.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.peterrk.pan.backend.dto.StatusResponse;

@RestController
@RequestMapping("/api/status")
public class StatusController {
  @GetMapping()
  public ResponseEntity<?> getStatus() {
    return ResponseEntity.status(HttpStatus.OK).body(new StatusResponse("READY"));
  }
}
