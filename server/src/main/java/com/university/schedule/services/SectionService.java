package com.university.schedule.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.university.schedule.dtos.SectionDTO;

public interface SectionService {
    SectionDTO create(SectionDTO dto);
    SectionDTO getById(String id);
    Page<SectionDTO> search(String keyword, String semester, Pageable pageable);
    SectionDTO update(String id, SectionDTO dto);
    void delete(String id);
}
