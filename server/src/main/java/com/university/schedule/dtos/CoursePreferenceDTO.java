package com.university.schedule.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoursePreferenceDTO {
    @NotBlank
    private String id;

    @NotBlank
    private String semesterId;

    @NotBlank
    private String teacherId;

    @NotBlank
    private String courseId;

    @NotNull
    private Integer preferenceValue;
}
