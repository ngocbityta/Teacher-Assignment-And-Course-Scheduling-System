package com.university.schedule.mappers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.schedule.dtos.AssignmentDTO;
import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.dtos.StatisticsDTO;
import com.university.schedule.entities.Schedule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduleJsonMapper {
    
    private final ObjectMapper objectMapper;

    public ScheduleDTO toDto(Schedule entity) {
        if (entity == null) {
            return null;
        }

        ScheduleDTO dto = ScheduleDTO.builder()
                .id(entity.getId())
                .semester(entity.getSemester() != null ? entity.getSemester() : null)
                .name(entity.getName())
                .objectiveValue(entity.getObjectiveValue())
                .build();

        // Parse assignments JSON
        if (entity.getAssignments() != null && !entity.getAssignments().isEmpty()) {
            try {
                List<AssignmentDTO> assignments = objectMapper.readValue(
                    entity.getAssignments(),
                    new TypeReference<List<AssignmentDTO>>() {}
                );
                dto.setAssignments(assignments);
            } catch (Exception e) {
                log.error("Error parsing assignments JSON: {}", e.getMessage());
                dto.setAssignments(Collections.emptyList());
            }
        } else {
            dto.setAssignments(Collections.emptyList());
        }

        // Parse statistics JSON
        if (entity.getStatistics() != null && !entity.getStatistics().isEmpty()) {
            try {
                StatisticsDTO statistics = objectMapper.readValue(
                    entity.getStatistics(),
                    StatisticsDTO.class
                );
                dto.setStatistics(statistics);
            } catch (Exception e) {
                log.error("Error parsing statistics JSON: {}", e.getMessage());
            }
        }

        // Parse penalties JSON
        if (entity.getPenalties() != null && !entity.getPenalties().isEmpty()) {
            try {
                Map<String, Object> penalties = objectMapper.readValue(
                    entity.getPenalties(),
                    new TypeReference<Map<String, Object>>() {}
                );
                dto.setPenalties(penalties);
            } catch (Exception e) {
                log.error("Error parsing penalties JSON: {}", e.getMessage());
            }
        }

        // Parse scores JSON
        if (entity.getScores() != null && !entity.getScores().isEmpty()) {
            try {
                Map<String, Object> scores = objectMapper.readValue(
                    entity.getScores(),
                    new TypeReference<Map<String, Object>>() {}
                );
                dto.setScores(scores);
            } catch (Exception e) {
                log.error("Error parsing scores JSON: {}", e.getMessage());
            }
        }

        return dto;
    }

    public Schedule toEntity(ScheduleDTO dto) {
        if (dto == null) {
            return null;
        }

        Schedule entity = Schedule.builder()
                .id(dto.getId())
                .name(dto.getName())
                .objectiveValue(dto.getObjectiveValue())
                .build();

        // Convert assignments to JSON (always set, even if empty)
        if (dto.getAssignments() != null) {
            try {
                entity.setAssignments(objectMapper.writeValueAsString(dto.getAssignments()));
            } catch (Exception e) {
                log.error("Error serializing assignments to JSON: {}", e.getMessage());
                // Set empty array as fallback
                try {
                    entity.setAssignments("[]");
                } catch (Exception e2) {
                    log.error("Error setting empty assignments array: {}", e2.getMessage());
                }
            }
        } else {
            // Set empty array if null
            entity.setAssignments("[]");
        }

        // Convert statistics to JSON (always set, even if null)
        if (dto.getStatistics() != null) {
            try {
                entity.setStatistics(objectMapper.writeValueAsString(dto.getStatistics()));
            } catch (Exception e) {
                log.error("Error serializing statistics to JSON: {}", e.getMessage());
            }
        } else {
            // Set empty statistics if null
            try {
                StatisticsDTO emptyStats = StatisticsDTO.builder()
                        .numAssignments(0)
                        .numClassrooms(0)
                        .numCourses(0)
                        .numSections(0)
                        .numTeachers(0)
                        .build();
                entity.setStatistics(objectMapper.writeValueAsString(emptyStats));
            } catch (Exception e) {
                log.error("Error setting empty statistics: {}", e.getMessage());
            }
        }

        // Convert penalties to JSON
        if (dto.getPenalties() != null && !dto.getPenalties().isEmpty()) {
            try {
                entity.setPenalties(objectMapper.writeValueAsString(dto.getPenalties()));
            } catch (Exception e) {
                log.error("Error serializing penalties to JSON: {}", e.getMessage());
            }
        }

        // Convert scores to JSON
        if (dto.getScores() != null && !dto.getScores().isEmpty()) {
            try {
                entity.setScores(objectMapper.writeValueAsString(dto.getScores()));
            } catch (Exception e) {
                log.error("Error serializing scores to JSON: {}", e.getMessage());
            }
        }

        return entity;
    }
}

