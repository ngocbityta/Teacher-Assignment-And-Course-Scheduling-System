package com.university.schedule.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private String error;
    private String message;
    private Map<String, String> errors; // For validation errors
    
    // Explicit constructor for common use case (error, message, null)
    public ErrorResponse(String error, String message) {
        this.error = error;
        this.message = message;
        this.errors = null;
    }
}

