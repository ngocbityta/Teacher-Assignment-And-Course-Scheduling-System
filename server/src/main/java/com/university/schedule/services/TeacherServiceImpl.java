package com.university.schedule.services;

import com.university.schedule.dtos.TeacherDTO;
import com.university.schedule.entities.Teacher;
import com.university.schedule.enums.RegistrationStatus;
import com.university.schedule.mappers.TeacherMapper;
import com.university.schedule.repositories.TeacherRepository;
import com.university.schedule.repositories.TeachingRegistrationRepository;
import com.university.schedule.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Transactional
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final TeacherMapper teacherMapper;
    private final TeachingRegistrationRepository teachingRegistrationRepository;

    @Override
    public TeacherDTO create(TeacherDTO dto) {
        if (teacherRepository.existsById(dto.getId())) {
            throw new IllegalArgumentException("Teacher already exists with id " + dto.getId());
        }
        Teacher teacher = teacherMapper.toEntity(dto);
        teacher.setSemester(dto.getSemester());
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
    public Page<TeacherDTO> search(String keyword, String semester, Pageable pageable) {
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
    @Transactional(readOnly = true)
    public List<TeacherDTO> getAvailableForRegistration(String semester) {
        // Chỉ loại trừ teachers có registration APPROVED hoặc PENDING
        // Cho phép teachers có registration REJECTED tạo lại
        List<String> registeredTeacherIds = teachingRegistrationRepository.findTeacherIdsBySemesterAndStatuses(
            semester, 
            Arrays.asList(RegistrationStatus.APPROVED, RegistrationStatus.PENDING)
        );
        List<Teacher> allTeachers = teacherRepository.findBySemester(semester, Pageable.unpaged()).getContent();
        return allTeachers.stream()
                .filter(teacher -> !registeredTeacherIds.contains(teacher.getId()))
                .map(teacherMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public TeacherDTO update(String id, TeacherDTO dto) {
        Teacher entity = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + id));
        entity.setName(dto.getName());
        entity.setStatus(dto.getStatus());
        entity.setSemester(dto.getSemester());
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
