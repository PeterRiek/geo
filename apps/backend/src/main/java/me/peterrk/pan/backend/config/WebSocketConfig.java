package me.peterrk.pan.backend.config;

import me.peterrk.pan.backend.service.GameService;
import me.peterrk.pan.backend.util.JwtUtil;
import me.peterrk.pan.backend.websocket.JwtHandshakeInterceptor;
import me.peterrk.pan.backend.websocket.GameWebSocketHandler;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

  private final JwtUtil jwtUtil;
  private final GameService gameService;

  public WebSocketConfig(JwtUtil jwtUtil, GameService gameService) {
    this.jwtUtil = jwtUtil;
    this.gameService = gameService;
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(new GameWebSocketHandler(gameService), "/ws/game")
        .addInterceptors(new JwtHandshakeInterceptor(jwtUtil))
        .setAllowedOrigins("*");
  }
}
