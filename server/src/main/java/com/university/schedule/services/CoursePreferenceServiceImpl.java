package com.university.schedule.services;

import com.university.schedule.dtos.CoursePreferenceDTO;
import com.university.schedule.entities.Course;
import com.university.schedule.entities.CoursePreference;
import com.university.schedule.entities.Semester;
import com.university.schedule.entities.Teacher;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.CoursePreferenceMapper;
import com.university.schedule.repositories.CoursePreferenceRepository;
import com.university.schedule.repositories.CourseRepository;
import com.university.schedule.repositories.SemesterRepository;
import com.university.schedule.repositories.TeacherRepository;
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
    private final SemesterRepository semesterRepository;
    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;

    @Override
    public CoursePreferenceDTO create(CoursePreferenceDTO dto) {
        if (coursePreferenceRepository.existsById(dto.getId())) {
            throw new IllegalArgumentException("CoursePreference already exists with id " + dto.getId());
        }

        CoursePreference entity = mapper.toEntity(dto);

        Semester semester = semesterRepository.findById(dto.getSemesterId())
                .orElseThrow(() -> new NotFoundException("Semester not found with id " + dto.getSemesterId()));
        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId()));
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new NotFoundException("Course not found with id " + dto.getCourseId()));

        entity.setSemester(semester);
        entity.setTeacher(teacher);
        entity.setCourse(course);

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

        Semester semester = semesterRepository.findById(dto.getSemesterId())
                .orElseThrow(() -> new NotFoundException("Semester not found with id " + dto.getSemesterId()));
        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId()));
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new NotFoundException("Course not found with id " + dto.getCourseId()));

        entity.setSemester(semester);
        entity.setTeacher(teacher);
        entity.setCourse(course);
        entity.setPreferenceValue(dto.getPreferenceValue());

        return mapper.toDto(coursePreferenceRepository.save(entity));
    }

    @Override
    public void delete(String id) {
        if (!coursePreferenceRepository.existsById(id)) {
            throw new NotFoundException("CoursePreference not found with id " + id);
        }
        coursePreferenceRepository.deleteById(id);
    }
}
