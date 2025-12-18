package com.university.schedule.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.DayOfWeek;


import com.university.schedule.enums.Period;

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

    @NotBlank(message = "Teacher ID is required")
    private String teacherId;

    @NotBlank(message = "Section ID is required")
    private String sectionId;

    @NotBlank(message = "Classroom ID is required")
    private String classroomId;

    @NotNull(message = "Day is required")
    private DayOfWeek day;

    @NotNull(message = "Period is required")
    private Period period;

    // Additional fields for display
    private String teacherName;
    private String sectionName;
    private String classroomName;
}
