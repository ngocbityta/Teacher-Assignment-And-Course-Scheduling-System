package com.university.schedule.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.university.schedule.dtos.SemesterDTO;
import com.university.schedule.entities.Semester;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.SemesterMapper;
import com.university.schedule.repositories.SemesterRepository;

@RequiredArgsConstructor
@Service
@Transactional
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;
    private final SemesterMapper semesterMapper;

    @Override
    public SemesterDTO create(SemesterDTO dto) {
        if (semesterRepository.existsById(dto.getId())) {
            throw new IllegalArgumentException("Semester already exists with id " + dto.getId());
        }
        Semester saved = semesterRepository.save(semesterMapper.toEntity(dto));
        return semesterMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SemesterDTO getById(String id) {
        Semester entity = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with id " + id));
        return semesterMapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SemesterDTO> search(String keyword, Pageable pageable) {
        Page<Semester> page = (keyword == null || keyword.isBlank())
                ? semesterRepository.findAll(pageable)
                : semesterRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
        return page.map(semesterMapper::toDto);
    }

    @Override
    public SemesterDTO update(String id, SemesterDTO dto) {
        Semester entity = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with id " + id));
        entity.setName(dto.getName());
        entity.setStartTime(dto.getStartTime());
        entity.setEndTime(dto.getEndTime());
        return semesterMapper.toDto(semesterRepository.save(entity));
    }

    @Override
    public void delete(String id) {
        if (!semesterRepository.existsById(id)) {
            throw new NotFoundException("Semester not found with id " + id);
        }
        semesterRepository.deleteById(id);
    }
}
