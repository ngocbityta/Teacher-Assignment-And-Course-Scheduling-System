package com.university.schedule.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsDTO {
    private Integer numAssignments;
    private Integer numClassrooms;
    private Integer numCourses;
    private Integer numSections;
    private Integer numTeachers;
}

