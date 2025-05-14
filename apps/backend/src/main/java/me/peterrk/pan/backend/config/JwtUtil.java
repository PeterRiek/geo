package me.peterrk.pan.backend.config;

import java.security.Key;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {
  private final String SECRET = "todo-add-shared-secret-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

  public Claims validateToken(String token) throws JwtException {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody();
  }
}
