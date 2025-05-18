package me.peterrk.pan.backend.config;

import me.peterrk.pan.backend.util.JwtUtil;
import me.peterrk.pan.backend.websocket.JwtHandshakeInterceptor;
import me.peterrk.pan.backend.websocket.EchoWebSocketHandler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

  @Autowired
  private JwtUtil jwtUtil;

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(new EchoWebSocketHandler(), "/ws/echo")
        .addInterceptors(new JwtHandshakeInterceptor(jwtUtil))
        .setAllowedOrigins("*");
  }
}
