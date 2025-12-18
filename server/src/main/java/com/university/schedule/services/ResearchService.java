package com.university.schedule.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResearchService {

    @Value("${research.service.url:http://localhost:8081}")
    private String researchServiceUrl;

    @Value("${research.service.endpoint:/schedule}")
    private String researchServiceEndpoint;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JsonNode callSchedulingService(Map<String, Object> requestData) {
        try {
            String url = researchServiceUrl + researchServiceEndpoint;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            String requestBody = objectMapper.writeValueAsString(requestData);
            
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                return responseJson;
            } else {
                log.error("Research service returned error: {}", response.getStatusCode());
                throw new RuntimeException("Research service returned error: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error calling research service", e);
            throw new RuntimeException("Failed to call research service: " + e.getMessage(), e);
        }
    }
}

