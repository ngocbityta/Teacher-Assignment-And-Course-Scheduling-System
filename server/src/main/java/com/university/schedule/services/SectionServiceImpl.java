package com.university.schedule.services;

import com.university.schedule.dtos.SectionDTO;
import com.university.schedule.entities.Course;
import com.university.schedule.entities.Section;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.SectionMapper;
import com.university.schedule.repositories.CourseRepository;
import com.university.schedule.repositories.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Transactional
public class SectionServiceImpl implements SectionService {

    private final SectionRepository sectionRepository;
    private final SectionMapper sectionMapper;
    private final CourseRepository courseRepository;

    @Override
    public SectionDTO create(SectionDTO dto) {
        if (sectionRepository.existsById(dto.getId())) {
            throw new IllegalArgumentException("Section already exists with id " + dto.getId());
        }
        Section entity = sectionMapper.toEntity(dto);

        // map courseId -> Course entity
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new NotFoundException("Course not found with id " + dto.getCourseId()));
        entity.setCourse(course);

        Section saved = sectionRepository.save(entity);
        return sectionMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SectionDTO getById(String id) {
        Section entity = sectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Section not found with id " + id));
        return sectionMapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SectionDTO> search(String keyword, Pageable pageable) {
        Page<Section> page = (keyword == null || keyword.isBlank())
                ? sectionRepository.findAll(pageable)
                : sectionRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
        return page.map(sectionMapper::toDto);
    }

    @Override
    public SectionDTO update(String id, SectionDTO dto) {
        Section entity = sectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Section not found with id " + id));

        entity.setName(dto.getName());

        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new NotFoundException("Course not found with id " + dto.getCourseId()));
        entity.setCourse(course);

        return sectionMapper.toDto(sectionRepository.save(entity));
    }

    @Override
    public void delete(String id) {
        Section entity = sectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Section not found with id " + id));
        sectionRepository.delete(entity);
    }
}
