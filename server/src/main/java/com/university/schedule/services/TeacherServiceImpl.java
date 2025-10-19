package com.university.schedule.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.university.schedule.dtos.TeacherDTO;
import com.university.schedule.entities.Teacher;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.TeacherMapper;
import com.university.schedule.repositories.TeacherRepository;

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
        Teacher saved = teacherRepository.save(teacherMapper.toEntity(dto));
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
    public Page<TeacherDTO> search(String keyword, Pageable pageable) {
        Page<Teacher> page = (keyword == null || keyword.isBlank())
                ? teacherRepository.findAll(pageable)
                : teacherRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
        return page.map(teacherMapper::toDto);
    }

    @Override
    public TeacherDTO update(String id, TeacherDTO dto) {
        Teacher entity = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + id));
        entity.setName(dto.getName());
        Teacher updated = teacherRepository.save(entity);
        return teacherMapper.toDto(updated);
    }

    @Override
    public void delete(String id) {
        if (!teacherRepository.existsById(id)) {
            throw new NotFoundException("Teacher not found with id " + id);
        }
        teacherRepository.deleteById(id);
    }
}
