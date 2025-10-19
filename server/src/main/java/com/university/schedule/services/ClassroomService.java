package com.university.schedule.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.university.schedule.dtos.ClassroomDTO;

public interface ClassroomService {
    ClassroomDTO create(ClassroomDTO dto);
    ClassroomDTO getById(String id);
    Page<ClassroomDTO> search(String keyword, Pageable pageable);
    ClassroomDTO update(String id, ClassroomDTO dto);
    void delete(String id);
}
