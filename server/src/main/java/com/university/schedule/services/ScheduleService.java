package com.university.schedule.services;

import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.enums.Semester;
import java.util.List;

public interface ScheduleService {
    ScheduleDTO create(ScheduleDTO dto);
    ScheduleDTO getById(String id);
    List<ScheduleDTO> getAll();
    ScheduleDTO update(String id, ScheduleDTO dto);
    void delete(String id);
    Integer evaluateScheduleValue(Semester semester);
}
