package me.peterrk.pan.backend.websocket;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import me.peterrk.pan.backend.util.JwtUtil;

public class JwtHandshakeInterceptor implements HandshakeInterceptor {

  private final JwtUtil jwtUtil;

  public JwtHandshakeInterceptor(JwtUtil jwtUtil) {
    this.jwtUtil = jwtUtil;
  }

  @Override
  public boolean beforeHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Map<String, Object> attributes) {

    if (request instanceof ServletServerHttpRequest servletRequest
        && response instanceof ServletServerHttpResponse servletResponse) {

      HttpServletRequest httpRequest = servletRequest.getServletRequest();
      HttpServletResponse httpResponse = servletResponse.getServletResponse();

      String token = httpRequest.getParameter("token");

      if (token != null && token.length() > 0 && jwtUtil.validateToken(token)) {
        String username = jwtUtil.extractUsername(token);
        attributes.put("username", username);
        return true;
      } else {
        httpResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
        return false;
      }
    }
    return false;
  }

  @Override
  public void afterHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Exception exception) {
    // nothing
  }

}
