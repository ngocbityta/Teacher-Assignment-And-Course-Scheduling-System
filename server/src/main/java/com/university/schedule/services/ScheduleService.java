package com.university.schedule.services;

import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.dtos.ScheduleEvaluationResultDTO;

import java.util.List;

public interface ScheduleService {
    ScheduleDTO create(ScheduleDTO dto);
    ScheduleDTO getById(String id);
    List<ScheduleDTO> getAll();
    List<ScheduleDTO> getBySemester(String semester);
    List<ScheduleDTO> getBySemesterAndName(String semester, String name);
    List<String> getScheduleSets(String semester);
    ScheduleDTO update(String id, ScheduleDTO dto);
    void delete(String id);
    void deleteByName(String semester, String name);
    ScheduleEvaluationResultDTO evaluateScheduleValue(String semester);
    ScheduleEvaluationResultDTO evaluateScheduleValue(String semester, String name);
}
