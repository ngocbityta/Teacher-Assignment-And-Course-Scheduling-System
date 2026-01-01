package com.university.schedule.services;

import com.university.schedule.dtos.ClassroomDTO;
import com.university.schedule.entities.Classroom;
import com.university.schedule.mappers.ClassroomMapper;
import com.university.schedule.repositories.ClassroomRepository;
import com.university.schedule.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Transactional
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final ClassroomMapper classroomMapper;

    @Override
    public ClassroomDTO create(ClassroomDTO dto) {
        if (classroomRepository.existsById(dto.getId())) {
            throw new IllegalArgumentException("Classroom already exists with id " + dto.getId());
        }
        Classroom classroom = classroomMapper.toEntity(dto);
        classroom.setSemester(dto.getSemester());
        Classroom saved = classroomRepository.save(classroom);
        return classroomMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomDTO getById(String id) {
        Classroom entity = classroomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Classroom not found with id " + id));
        return classroomMapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClassroomDTO> search(String keyword, String semester, Pageable pageable) {
        Page<Classroom> page;
        if (keyword == null || keyword.isBlank()) {
            if (semester != null) {
                page = classroomRepository.findBySemester(semester, pageable);
            } else {
                page = classroomRepository.findAll(pageable);
            }
        } else {
            if (semester != null) {
                page = classroomRepository.findByNameContainingIgnoreCaseAndSemester(keyword.trim(), semester, pageable);
            } else {
                page = classroomRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
            }
        }
        return page.map(classroomMapper::toDto);
    }

    @Override
    public ClassroomDTO update(String id, ClassroomDTO dto) {
        Classroom entity = classroomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Classroom not found with id " + id));
        entity.setName(dto.getName());
        entity.setCapacity(dto.getCapacity());
        entity.setStatus(dto.getStatus());
        entity.setSemester(dto.getSemester());
        return classroomMapper.toDto(classroomRepository.save(entity));
    }

    @Override
    public void delete(String id) {
        Classroom entity = classroomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Classroom not found with id " + id));
        classroomRepository.delete(entity);
    }
}
