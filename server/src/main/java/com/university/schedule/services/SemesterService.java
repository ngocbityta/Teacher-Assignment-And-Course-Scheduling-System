package com.university.schedule.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.university.schedule.dtos.SemesterDTO;

public interface SemesterService {
    SemesterDTO create(SemesterDTO dto);
    SemesterDTO getById(String id);
    Page<SemesterDTO> search(String keyword, Pageable pageable);
    SemesterDTO update(String id, SemesterDTO dto);
    void delete(String id);
}
