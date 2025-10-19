package com.university.schedule.services;

import com.university.schedule.dtos.TimePreferenceDTO;
import com.university.schedule.entities.Semester;
import com.university.schedule.entities.Teacher;
import com.university.schedule.entities.TimePreference;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.TimePreferenceMapper;
import com.university.schedule.repositories.SemesterRepository;
import com.university.schedule.repositories.TeacherRepository;
import com.university.schedule.repositories.TimePreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Transactional
public class TimePreferenceServiceImpl implements TimePreferenceService {

    private final TimePreferenceRepository repository;
    private final TimePreferenceMapper mapper;
    private final TeacherRepository teacherRepository;
    private final SemesterRepository semesterRepository;

    @Override
    public TimePreferenceDTO create(TimePreferenceDTO dto) {
        if (repository.existsById(dto.getId())) {
            throw new IllegalArgumentException("TimePreference already exists with id " + dto.getId());
        }

        TimePreference entity = mapper.toEntity(dto);

        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId()));
        Semester semester = semesterRepository.findById(dto.getSemesterId())
                .orElseThrow(() -> new NotFoundException("Semester not found with id " + dto.getSemesterId()));

        entity.setTeacher(teacher);
        entity.setSemester(semester);

        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public TimePreferenceDTO getById(String id) {
        TimePreference entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("TimePreference not found with id " + id));
        return mapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimePreferenceDTO> getAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @Override
    public TimePreferenceDTO update(String id, TimePreferenceDTO dto) {
        TimePreference entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("TimePreference not found with id " + id));

        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId()));
        Semester semester = semesterRepository.findById(dto.getSemesterId())
                .orElseThrow(() -> new NotFoundException("Semester not found with id " + dto.getSemesterId()));

        entity.setTeacher(teacher);
        entity.setSemester(semester);
        entity.setPeriod(dto.getPeriod());
        entity.setDay(dto.getDay());
        entity.setPreferenceValue(dto.getPreferenceValue());

        return mapper.toDto(repository.save(entity));
    }

    @Override
    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("TimePreference not found with id " + id);
        }
        repository.deleteById(id);
    }
}
