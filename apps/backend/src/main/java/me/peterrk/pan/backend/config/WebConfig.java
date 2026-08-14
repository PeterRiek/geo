package me.peterrk.pan.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Value("${app.uploads.dir:uploads}")
  private String uploadsDir;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Only preview images are web-accessible — coordinates files stay backend-internal
    // (read directly off disk by GameMapService) and are never exposed over HTTP.
    registry.addResourceHandler("/uploads/images/**")
        .addResourceLocations("file:" + uploadsDir + "/images/");
  }
}
