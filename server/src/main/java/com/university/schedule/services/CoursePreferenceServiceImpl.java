package com.university.schedule.services;

import com.university.schedule.dtos.CoursePreferenceDTO;
import com.university.schedule.entities.Course;
import com.university.schedule.entities.CoursePreference;
import com.university.schedule.entities.Teacher;
import com.university.schedule.entities.TeachingRegistration;
import com.university.schedule.mappers.CoursePreferenceMapper;
import com.university.schedule.repositories.CoursePreferenceRepository;
import com.university.schedule.repositories.CourseRepository;
import com.university.schedule.repositories.TeacherRepository;
import com.university.schedule.repositories.TeachingRegistrationRepository;
import com.university.schedule.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Transactional
public class CoursePreferenceServiceImpl implements CoursePreferenceService {

    private final CoursePreferenceRepository coursePreferenceRepository;
    private final CoursePreferenceMapper mapper;
    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final TeachingRegistrationRepository teachingRegistrationRepository;

    @Override
    public CoursePreferenceDTO create(CoursePreferenceDTO dto) {
        // Check if ID already exists
        if (dto.getId() != null && coursePreferenceRepository.existsById(dto.getId())) {
            throw new IllegalArgumentException("CoursePreference already exists with id " + dto.getId());
        }

        // Mapper ignores ID, so entity will have null ID
        CoursePreference entity = mapper.toEntity(dto);
        
        // Set ID if provided
        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }

        String semester = dto.getSemester();
        
        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId()));
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new NotFoundException("Course not found with id " + dto.getCourseId()));
        TeachingRegistration teachingRegistration = teachingRegistrationRepository.findById(dto.getTeachingRegistrationId())
                .orElseThrow(() -> new NotFoundException("TeachingRegistration not found with id " + dto.getTeachingRegistrationId()));

        entity.setSemester(semester);
        entity.setTeacher(teacher);
        entity.setCourse(course);
        entity.setTeachingRegistration(teachingRegistration);

        CoursePreference saved = coursePreferenceRepository.save(entity);
        return mapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CoursePreferenceDTO getById(String id) {
        CoursePreference entity = coursePreferenceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("CoursePreference not found with id " + id));
        return mapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CoursePreferenceDTO> getAll() {
        return coursePreferenceRepository.findAll()
                .stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public CoursePreferenceDTO update(String id, CoursePreferenceDTO dto) {
        CoursePreference entity = coursePreferenceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("CoursePreference not found with id " + id));

        String semester = dto.getSemester();
        
        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId()));
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new NotFoundException("Course not found with id " + dto.getCourseId()));
        TeachingRegistration teachingRegistration = teachingRegistrationRepository.findById(dto.getTeachingRegistrationId())
                .orElseThrow(() -> new NotFoundException("TeachingRegistration not found with id " + dto.getTeachingRegistrationId()));

        entity.setSemester(semester);
        entity.setTeacher(teacher);
        entity.setCourse(course);
        entity.setTeachingRegistration(teachingRegistration);
        entity.setPreferenceValue(dto.getPreferenceValue());

        return mapper.toDto(coursePreferenceRepository.save(entity));
    }

    @Override
    public void delete(String id) {
        CoursePreference entity = coursePreferenceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("CoursePreference not found with id " + id));
        coursePreferenceRepository.delete(entity);
    }
}
