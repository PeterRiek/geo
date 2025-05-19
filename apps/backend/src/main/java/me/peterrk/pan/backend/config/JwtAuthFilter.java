package me.peterrk.pan.backend.config;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import me.peterrk.pan.backend.util.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  @Autowired
  private JwtUtil jwtUtil;

  @Autowired
  private UserDetailsService userDetailsService;

  @Override
  protected void doFilterInternal(HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain)
      throws ServletException, IOException {

    final String authHeader = request.getHeader("Authorization");
    String username = null;
    String jwt = null;

    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      jwt = authHeader.substring(7);

      try {
        username = jwtUtil.extractUsername(jwt);
      } catch (ExpiredJwtException e) {
        // TODO: feedback to client
        logger.warn("JWT token expired");
      } catch (Exception e) {
        // TODO: feedback to client
        logger.warn("JWT token invalid");
      }
    }

    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      UserDetails userDetails = userDetailsService.loadUserByUsername(username);

      if (jwtUtil.validateToken(jwt, userDetails)) {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities());

        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
      }
    }

    filterChain.doFilter(request, response);
  }
}
