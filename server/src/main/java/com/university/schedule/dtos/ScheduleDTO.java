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
    @NotBlank
    private String id;

    @NotBlank
    private String semesterId;

    @NotBlank
    private String teacherId;

    @NotBlank
    private String sectionId;

    @NotBlank
    private String classroomId;

    @NotNull
    private DayOfWeek day;

    @NotNull
    private Period period;
}
