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

    @NotBlank
    private String id;

    @NotBlank
    private String teacherId;

    @NotBlank
    private String semester;

    @NotNull
    private Integer maxCourses;

    @NotNull
    private RegistrationStatus status;
}
