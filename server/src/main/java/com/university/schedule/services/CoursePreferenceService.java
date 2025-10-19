package com.university.schedule.services;

import com.university.schedule.dtos.CoursePreferenceDTO;
import java.util.List;

public interface CoursePreferenceService {
    CoursePreferenceDTO create(CoursePreferenceDTO dto);
    CoursePreferenceDTO getById(String id);
    List<CoursePreferenceDTO> getAll();
    CoursePreferenceDTO update(String id, CoursePreferenceDTO dto);
    void delete(String id);
}
