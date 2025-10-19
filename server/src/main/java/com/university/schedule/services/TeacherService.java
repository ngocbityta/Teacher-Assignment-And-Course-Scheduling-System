package com.university.schedule.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.university.schedule.dtos.TeacherDTO;

public interface TeacherService {
    TeacherDTO create(TeacherDTO dto);

    TeacherDTO getById(String id);

    Page<TeacherDTO> search(String keyword, Pageable pageable);

    TeacherDTO update(String id, TeacherDTO dto);

    void delete(String id);
}
