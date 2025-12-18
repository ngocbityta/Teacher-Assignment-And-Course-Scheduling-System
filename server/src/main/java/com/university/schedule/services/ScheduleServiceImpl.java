package com.university.schedule.services;

import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.entities.*;
import com.university.schedule.enums.Semester;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.ScheduleMapper;
import com.university.schedule.repositories.*;
import com.university.schedule.utils.SemesterUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Transactional
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository repository;
    private final ScheduleMapper mapper;
    private final TeacherRepository teacherRepository;
    private final SectionRepository sectionRepository;
    private final ClassroomRepository classroomRepository;
    private final CoursePreferenceRepository coursePreferenceRepository;
    private final TimePreferenceRepository timePreferenceRepository;

    @Override
    public ScheduleDTO create(ScheduleDTO dto) {
        if (repository.existsById(dto.getId())) {
            throw new IllegalArgumentException("Schedule already exists with id " + dto.getId());
        }

        Schedule entity = mapper.toEntity(dto);

        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId()));
        
        Semester semester = SemesterUtils.parseSemester(dto.getSemester());
        
        Section section = sectionRepository.findById(dto.getSectionId())
                .orElseThrow(() -> new NotFoundException("Section not found with id " + dto.getSectionId()));
        Classroom classroom = classroomRepository.findById(dto.getClassroomId())
                .orElseThrow(() -> new NotFoundException("Classroom not found with id " + dto.getClassroomId()));

        entity.setTeacher(teacher);
        entity.setSemester(semester);
        entity.setSection(section);
        entity.setClassroom(classroom);
        entity.setDay(dto.getDay());
        entity.setPeriod(dto.getPeriod());

        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public ScheduleDTO getById(String id) {
        Schedule entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Schedule not found with id " + id));
        return mapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleDTO> getAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @Override
    public ScheduleDTO update(String id, ScheduleDTO dto) {
        Schedule entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Schedule not found with id " + id));

        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId()));
        
        Semester semester = SemesterUtils.parseSemester(dto.getSemester());
        
        Section section = sectionRepository.findById(dto.getSectionId())
                .orElseThrow(() -> new NotFoundException("Section not found with id " + dto.getSectionId()));
        Classroom classroom = classroomRepository.findById(dto.getClassroomId())
                .orElseThrow(() -> new NotFoundException("Classroom not found with id " + dto.getClassroomId()));

        entity.setTeacher(teacher);
        entity.setSemester(semester);
        entity.setSection(section);
        entity.setClassroom(classroom);
        entity.setDay(dto.getDay());
        entity.setPeriod(dto.getPeriod());

        return mapper.toDto(repository.save(entity));
    }

    @Override
    public void delete(String id) {
        Schedule entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Schedule not found with id " + id));
        repository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Integer evaluateScheduleValue(Semester semester) {
        List<Schedule> schedules = repository.findAll().stream()
                .filter(s -> s.getSemester().equals(semester))
                .collect(Collectors.toList());

        if (schedules.isEmpty()) {
            return 0;
        }

        int totalScore = 0;

        for (Schedule schedule : schedules) {
            Teacher teacher = schedule.getTeacher();
            Section section = schedule.getSection();
            Course course = section.getCourse();

            // Find course preference
            List<CoursePreference> coursePreferences = coursePreferenceRepository.findAll().stream()
                    .filter(cp -> cp.getTeacher().getId().equals(teacher.getId()))
                    .filter(cp -> cp.getCourse() != null && cp.getCourse().getId().equals(course.getId()))
                    .filter(cp -> cp.getSemester().equals(semester))
                    .collect(Collectors.toList());

            if (!coursePreferences.isEmpty()) {
                Integer coursePrefValue = coursePreferences.get(0).getPreferenceValue();
                if (coursePrefValue != null) {
                    totalScore += coursePrefValue;
                }
            }

            // Find time preference
            List<TimePreference> timePreferences = timePreferenceRepository.findAll().stream()
                    .filter(tp -> tp.getTeacher().getId().equals(teacher.getId()))
                    .filter(tp -> tp.getSemester().equals(semester))
                    .filter(tp -> tp.getDay().equals(schedule.getDay()))
                    .filter(tp -> tp.getPeriod().equals(schedule.getPeriod()))
                    .collect(Collectors.toList());

            if (!timePreferences.isEmpty()) {
                Integer timePrefValue = timePreferences.get(0).getPreferenceValue();
                if (timePrefValue != null) {
                    totalScore += timePrefValue;
                }
            }
        }

        return totalScore;
    }
}
