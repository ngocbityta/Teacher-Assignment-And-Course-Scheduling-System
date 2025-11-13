package com.university.schedule.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherDTO {
    @NotBlank(message = "Id is required")
    private String id;

    @NotBlank(message = "Name is required")
    private String name;

    private String status; // e.g., "active", "inactive", "on_leave"
}
