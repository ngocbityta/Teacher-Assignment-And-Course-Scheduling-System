package com.university.schedule.services;

import com.university.schedule.dtos.PeriodDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PeriodService {
    PeriodDTO create(PeriodDTO dto);
    PeriodDTO getById(String id);
    List<PeriodDTO> getAll();
    Page<PeriodDTO> search(String keyword, Pageable pageable);
    PeriodDTO update(String id, PeriodDTO dto);
    void delete(String id);
}


