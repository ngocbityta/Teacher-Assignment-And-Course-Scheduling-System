package com.university.schedule.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

@Slf4j
public class DatabaseInitializationContextInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment environment = applicationContext.getEnvironment();
        
        String datasourceUrl = environment.getProperty("spring.datasource.url");
        String datasourceUsername = environment.getProperty("spring.datasource.username");
        String datasourcePassword = environment.getProperty("spring.datasource.password");
        String flywayEnabled = environment.getProperty("spring.flyway.enabled", "true");

        if (datasourceUrl == null || !flywayEnabled.equals("true")) {
            return;
        }

        try {
            String dbName = extractDatabaseName(datasourceUrl);
            String baseUrl = extractBaseUrl(datasourceUrl);

            try (Connection conn = DriverManager.getConnection(baseUrl, datasourceUsername, datasourcePassword);
                 Statement stmt = conn.createStatement()) {

                ResultSet rs = stmt.executeQuery(
                    "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'"
                );

                if (!rs.next()) {
                    stmt.executeUpdate("CREATE DATABASE " + dbName);
                }
            }
        } catch (Exception e) {
            log.error("Failed to initialize database: {}", e.getMessage(), e);
            throw new RuntimeException("Database initialization failed: " + e.getMessage(), e);
        }
    }

    private String extractDatabaseName(String url) {
        int lastSlash = url.lastIndexOf('/');
        if (lastSlash == -1) {
            throw new IllegalArgumentException("Invalid database URL: " + url);
        }
        String dbPart = url.substring(lastSlash + 1);
        int questionMark = dbPart.indexOf('?');
        return questionMark == -1 ? dbPart : dbPart.substring(0, questionMark);
    }

    private String extractBaseUrl(String url) {
        int lastSlash = url.lastIndexOf('/');
        if (lastSlash == -1) {
            throw new IllegalArgumentException("Invalid database URL: " + url);
        }
        return url.substring(0, lastSlash + 1) + "postgres";
    }
}

