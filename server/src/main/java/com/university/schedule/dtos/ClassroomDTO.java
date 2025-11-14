package com.university.schedule.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomDTO {
    @NotBlank(message = "Id is required")
    private String id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Capacity is required")
    private Integer capacity;

    private String status; // e.g., "active", "inactive", "maintenance"

    @NotBlank(message = "Semester is required")
    private String semester;
}
