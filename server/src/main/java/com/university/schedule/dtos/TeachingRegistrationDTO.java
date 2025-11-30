package com.university.schedule.dtos;

import com.university.schedule.enums.RegistrationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeachingRegistrationDTO {

    @NotBlank(message = "Id is required")
    private String id;

    @NotBlank(message = "Teacher ID is required")
    private String teacherId;

    @NotBlank(message = "Semester is required")
    private String semester;

    @NotNull(message = "Max courses is required")
    private Integer maxCourses;

    @NotNull(message = "Status is required")
    private RegistrationStatus status;
}
