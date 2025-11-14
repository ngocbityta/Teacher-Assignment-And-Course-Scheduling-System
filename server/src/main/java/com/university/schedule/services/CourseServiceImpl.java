package com.university.schedule.services;

import com.university.schedule.dtos.CourseDTO;
import com.university.schedule.entities.Course;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.CourseMapper;
import com.university.schedule.repositories.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Transactional
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;

    @Override
    public CourseDTO create(CourseDTO dto) {
        if (courseRepository.existsById(dto.getId())) {
            throw new IllegalArgumentException("Course already exists with id " + dto.getId());
        }
        Course saved = courseRepository.save(courseMapper.toEntity(dto));
        return courseMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseDTO getById(String id) {
        Course entity = courseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Course not found with id " + id));
        return courseMapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CourseDTO> search(String keyword, Pageable pageable) {
        Page<Course> page = (keyword == null || keyword.isBlank())
                ? courseRepository.findAll(pageable)
                : courseRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
        return page.map(courseMapper::toDto);
    }

    @Override
    public CourseDTO update(String id, CourseDTO dto) {
        Course entity = courseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Course not found with id " + id));
        entity.setName(dto.getName());
        entity.setMinTeachers(dto.getMinTeachers());
        entity.setMaxTeachers(dto.getMaxTeachers());
        return courseMapper.toDto(courseRepository.save(entity));
    }

    @Override
    public void delete(String id) {
        Course entity = courseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Course not found with id " + id));
        courseRepository.delete(entity);
    }
}
