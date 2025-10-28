package com.university.schedule.services;

import com.university.schedule.dtos.TeachingRegistrationDTO;
import com.university.schedule.entities.*;
import com.university.schedule.mappers.TeachingRegistrationMapper;
import com.university.schedule.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeachingRegistrationServiceImpl implements TeachingRegistrationService {

    private final TeachingRegistrationRepository teachingRegistrationRepository;
    private final TeacherRepository teacherRepository;
    private final SemesterRepository semesterRepository;
    private final TeachingRegistrationMapper mapper;

    @Override
    public TeachingRegistrationDTO create(TeachingRegistrationDTO dto) {
        TeachingRegistration entity = mapper.toEntity(dto);
        entity.setTeacher(teacherRepository.getReferenceById(dto.getTeacherId()));
        entity.setSemester(semesterRepository.getReferenceById(dto.getSemesterId()));
        return mapper.toDto(teachingRegistrationRepository.save(entity));
    }

    @Override
    public TeachingRegistrationDTO update(String id, TeachingRegistrationDTO dto) {
        TeachingRegistration existing = teachingRegistrationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TeachingRegistration not found: " + id));

        existing.setMaxCourses(dto.getMaxCourses());
        existing.setStatus(dto.getStatus());
        existing.setTeacher(teacherRepository.getReferenceById(dto.getTeacherId()));
        existing.setSemester(semesterRepository.getReferenceById(dto.getSemesterId()));

        return mapper.toDto(teachingRegistrationRepository.save(existing));
    }

    @Override
    public TeachingRegistrationDTO getById(String id) {
        TeachingRegistration entity = teachingRegistrationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TeachingRegistration not found: " + id));
        return mapper.toDto(entity);
    }

    @Override
    public List<TeachingRegistrationDTO> getAll() {
        return teachingRegistrationRepository.findAll().stream().map(mapper::toDto).toList();
    }

    @Override
    public void delete(String id) {
        if (!teachingRegistrationRepository.existsById(id)) {
            throw new EntityNotFoundException("TeachingRegistration not found: " + id);
        }
        teachingRegistrationRepository.deleteById(id);
    }
}
