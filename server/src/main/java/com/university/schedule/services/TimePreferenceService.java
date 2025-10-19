package com.university.schedule.services;

import com.university.schedule.dtos.TimePreferenceDTO;
import java.util.List;

public interface TimePreferenceService {
    TimePreferenceDTO create(TimePreferenceDTO dto);
    TimePreferenceDTO getById(String id);
    List<TimePreferenceDTO> getAll();
    TimePreferenceDTO update(String id, TimePreferenceDTO dto);
    void delete(String id);
}
