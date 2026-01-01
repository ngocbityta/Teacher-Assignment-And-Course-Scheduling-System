package com.university.schedule.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleEvaluationResultDTO {
    private Double totalScore;
    private Double workloadPenalty;
    private Double compactnessPenalty;
    private Double coursePreferenceScore;
    private Double timePreferenceScore;
}
