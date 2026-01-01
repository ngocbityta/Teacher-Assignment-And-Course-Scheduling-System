package com.university.schedule.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.university.schedule.dtos.TeacherDTO;


import java.util.List;

public interface TeacherService {
    TeacherDTO create(TeacherDTO dto);

    TeacherDTO getById(String id);

    Page<TeacherDTO> search(String keyword, String semester, Pageable pageable);
    
    List<TeacherDTO> getAvailableForRegistration(String semester);

    TeacherDTO update(String id, TeacherDTO dto);

    void delete(String id);
}
