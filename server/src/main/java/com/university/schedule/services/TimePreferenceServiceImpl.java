package com.university.schedule.services;

import com.university.schedule.dtos.TimePreferenceDTO;
import com.university.schedule.entities.Period;
import com.university.schedule.entities.Teacher;
import com.university.schedule.entities.TimePreference;
import com.university.schedule.entities.TeachingRegistration;
import com.university.schedule.mappers.TimePreferenceMapper;
import com.university.schedule.repositories.PeriodRepository;
import com.university.schedule.repositories.TeacherRepository;
import com.university.schedule.repositories.TeachingRegistrationRepository;
import com.university.schedule.repositories.TimePreferenceRepository;
import com.university.schedule.exceptions.NotFoundException;
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
    private final TeachingRegistrationRepository teachingRegistrationRepository;
    private final PeriodRepository periodRepository;

    @Override
    public TimePreferenceDTO create(TimePreferenceDTO dto) {
        if (repository.existsById(dto.getId())) {
            throw new IllegalArgumentException("TimePreference already exists with id " + dto.getId());
        }

        TimePreference entity = mapper.toEntity(dto);

        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId()));
        TeachingRegistration teachingRegistration = teachingRegistrationRepository.findById(dto.getTeachingRegistrationId())
                .orElseThrow(() -> new NotFoundException("TeachingRegistration not found with id " + dto.getTeachingRegistrationId()));
        Period period = periodRepository.findById(dto.getPeriodId())
                .orElseThrow(() -> new NotFoundException("Period not found with id " + dto.getPeriodId()));
        
        String semester = dto.getSemester();

        entity.setTeacher(teacher);
        entity.setSemester(semester);
        entity.setTeachingRegistration(teachingRegistration);
        entity.setPeriod(period);
        entity.setDay(dto.getDay());
        entity.setPreferenceValue(dto.getPreferenceValue());

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
        TeachingRegistration teachingRegistration = teachingRegistrationRepository.findById(dto.getTeachingRegistrationId())
                .orElseThrow(() -> new NotFoundException("TeachingRegistration not found with id " + dto.getTeachingRegistrationId()));
        Period period = periodRepository.findById(dto.getPeriodId())
                .orElseThrow(() -> new NotFoundException("Period not found with id " + dto.getPeriodId()));
        
        String semester = dto.getSemester();

        entity.setTeacher(teacher);
        entity.setSemester(semester);
        entity.setTeachingRegistration(teachingRegistration);
        entity.setPeriod(period);
        entity.setDay(dto.getDay());
        entity.setPreferenceValue(dto.getPreferenceValue());

        return mapper.toDto(repository.save(entity));
    }

    @Override
    public void delete(String id) {
        TimePreference entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("TimePreference not found with id " + id));
        repository.delete(entity);
    }
}
