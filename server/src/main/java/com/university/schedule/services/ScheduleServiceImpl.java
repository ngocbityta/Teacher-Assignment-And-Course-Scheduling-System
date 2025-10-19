package com.university.schedule.services;

import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.entities.*;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.ScheduleMapper;
import com.university.schedule.repositories.*;
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
    private final SemesterRepository semesterRepository;
    private final SectionRepository sectionRepository;
    private final ClassroomRepository classroomRepository;

    @Override
    public ScheduleDTO create(ScheduleDTO dto) {
        if (repository.existsById(dto.getId())) {
            throw new IllegalArgumentException("Schedule already exists with id " + dto.getId());
        }

        Schedule entity = mapper.toEntity(dto);

        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId()));
        Semester semester = semesterRepository.findById(dto.getSemesterId())
                .orElseThrow(() -> new NotFoundException("Semester not found with id " + dto.getSemesterId()));
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
        Semester semester = semesterRepository.findById(dto.getSemesterId())
                .orElseThrow(() -> new NotFoundException("Semester not found with id " + dto.getSemesterId()));
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
        if (!repository.existsById(id)) {
            throw new NotFoundException("Schedule not found with id " + id);
        }
        repository.deleteById(id);
    }
}
