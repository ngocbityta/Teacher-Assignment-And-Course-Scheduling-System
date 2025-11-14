package com.university.schedule.services;

import com.university.schedule.dtos.TeacherDTO;
import com.university.schedule.entities.Teacher;
import com.university.schedule.enums.Semester;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.TeacherMapper;
import com.university.schedule.repositories.TeacherRepository;
import com.university.schedule.utils.SemesterUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Transactional
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final TeacherMapper teacherMapper;

    @Override
    public TeacherDTO create(TeacherDTO dto) {
        if (teacherRepository.existsById(dto.getId())) {
            throw new IllegalArgumentException("Teacher already exists with id " + dto.getId());
        }
        Teacher teacher = teacherMapper.toEntity(dto);
        teacher.setSemester(SemesterUtils.parseSemester(dto.getSemester()));
        Teacher saved = teacherRepository.save(teacher);
        return teacherMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherDTO getById(String id) {
        Teacher entity = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + id));
        return teacherMapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TeacherDTO> search(String keyword, Semester semester, Pageable pageable) {
        Page<Teacher> page;
        if (keyword == null || keyword.isBlank()) {
            if (semester != null) {
                page = teacherRepository.findBySemester(semester, pageable);
            } else {
                page = teacherRepository.findAll(pageable);
            }
        } else {
            if (semester != null) {
                page = teacherRepository.findByNameContainingIgnoreCaseAndSemester(keyword.trim(), semester, pageable);
            } else {
                page = teacherRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
            }
        }
        return page.map(teacherMapper::toDto);
    }

    @Override
    public TeacherDTO update(String id, TeacherDTO dto) {
        Teacher entity = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + id));
        entity.setName(dto.getName());
        entity.setStatus(dto.getStatus());
        entity.setSemester(SemesterUtils.parseSemester(dto.getSemester()));
        Teacher updated = teacherRepository.save(entity);
        return teacherMapper.toDto(updated);
    }

    @Override
    public void delete(String id) {
        Teacher entity = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + id));
        teacherRepository.delete(entity);
    }
}
