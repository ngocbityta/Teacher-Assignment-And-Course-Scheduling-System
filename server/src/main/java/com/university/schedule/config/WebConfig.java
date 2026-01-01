package com.university.schedule.config;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.client.url:http://localhost:5173}")
    private String clientUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Allow multiple origins for local development
        // Both Docker and local dev now use port 5173
        List<String> allowedOrigins = Arrays.asList(
            clientUrl,
            "http://localhost:5173",  // Vite dev server / Docker client
            "http://localhost:3000",  // Legacy support
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
        );
        
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }


}
