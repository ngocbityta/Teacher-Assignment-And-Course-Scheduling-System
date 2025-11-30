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
    @NotBlank(message = "Id is required")
    private String id;

    @NotBlank(message = "Semester is required")
    private String semester;

    @NotBlank(message = "Teacher ID is required")
    private String teacherId;

    @NotBlank(message = "Teaching registration ID is required")
    private String teachingRegistrationId;

    @NotBlank(message = "Course ID is required")
    private String courseId;

    @NotNull(message = "Preference value is required")
    private Integer preferenceValue;
}
