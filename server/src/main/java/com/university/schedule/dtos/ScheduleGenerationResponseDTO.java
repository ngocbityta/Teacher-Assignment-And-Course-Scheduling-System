package com.university.schedule.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleGenerationResponseDTO {
    private List<ScheduleDTO> schedules;
    private Integer objectiveValue;
}
