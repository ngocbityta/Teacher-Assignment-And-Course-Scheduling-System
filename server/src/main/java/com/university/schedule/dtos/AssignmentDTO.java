package com.university.schedule.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentDTO {
    private String teacherId;
    private String sectionId;
    private String classroomId;
    private String day; // "Mon", "Tue", etc.
    private String period; // period order index as string
    private String courseId; // Optional, can be derived from section
}

