package com.university.schedule.dtos;

import com.university.schedule.enums.Period;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.DayOfWeek;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimePreferenceDTO {
    @NotBlank(message = "Id is required")
    private String id;

    @NotBlank(message = "Teacher ID is required")
    private String teacherId;

    @NotBlank(message = "Semester is required")
    private String semester;

    @NotNull(message = "Period is required")
    private Period period;

    @NotNull(message = "Day is required")
    private DayOfWeek day;

    @NotBlank(message = "Teaching registration ID is required")
    private String teachingRegistrationId;

    @NotNull(message = "Preference value is required")
    private Integer preferenceValue;
}
