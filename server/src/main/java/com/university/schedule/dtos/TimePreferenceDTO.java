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
    @NotBlank
    private String id;

    @NotBlank
    private String teacherId;

    @NotBlank
    private String semesterId;

    @NotNull
    private Period period;

    @NotNull
    private DayOfWeek day;

    @NotNull
    private Integer preferenceValue;
}
