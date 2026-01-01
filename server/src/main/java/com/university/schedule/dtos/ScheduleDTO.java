package com.university.schedule.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleDTO {
    @NotBlank(message = "Id is required")
    private String id;

    @NotBlank(message = "Semester is required")
    private String semester;

    @NotBlank(message = "Name is required")
    private String name;

    // JSON fields
    private List<AssignmentDTO> assignments;
    
    private StatisticsDTO statistics;
    
    private Integer objectiveValue;
    
    private Map<String, Object> penalties; // Flexible structure for penalties
    
    private Map<String, Object> scores; // Flexible structure for scores
}
