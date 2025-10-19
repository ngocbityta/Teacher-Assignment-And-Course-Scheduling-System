package com.university.schedule.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.university.schedule.dtos.CourseDTO;

public interface CourseService {
    CourseDTO create(CourseDTO dto);
    CourseDTO getById(String id);
    Page<CourseDTO> search(String keyword, Pageable pageable);
    CourseDTO update(String id, CourseDTO dto);
    void delete(String id);
}
