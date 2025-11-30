package com.university.schedule.services;

import com.university.schedule.dtos.TeachingRegistrationDTO;
import com.university.schedule.entities.*;
import com.university.schedule.enums.RegistrationStatus;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.TeachingRegistrationMapper;
import com.university.schedule.repositories.*;
import com.university.schedule.utils.SemesterUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
@Service
@Transactional
public class TeachingRegistrationServiceImpl implements TeachingRegistrationService {

    private final TeachingRegistrationRepository teachingRegistrationRepository;
    private final TeacherRepository teacherRepository;
    private final TeachingRegistrationMapper mapper;

    @Override
    public TeachingRegistrationDTO create(TeachingRegistrationDTO dto) {
        TeachingRegistration entity = mapper.toEntity(dto);
        entity.setTeacher(teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId())));
        entity.setSemester(SemesterUtils.parseSemester(dto.getSemester()));
        return mapper.toDto(teachingRegistrationRepository.save(entity));
    }

    @Override
    public TeachingRegistrationDTO update(String id, TeachingRegistrationDTO dto) {
        TeachingRegistration existing = teachingRegistrationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingRegistration not found with id " + id));

        existing.setMaxCourses(dto.getMaxCourses());
        existing.setStatus(dto.getStatus());
        existing.setTeacher(teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found with id " + dto.getTeacherId())));
        existing.setSemester(SemesterUtils.parseSemester(dto.getSemester()));

        return mapper.toDto(teachingRegistrationRepository.save(existing));
    }

    @Override
    @Transactional(readOnly = true)
    public TeachingRegistrationDTO getById(String id) {
        TeachingRegistration entity = teachingRegistrationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingRegistration not found with id " + id));
        return mapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeachingRegistrationDTO> getAll() {
        return teachingRegistrationRepository.findAll().stream().map(mapper::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeachingRegistrationDTO> getByStatus(RegistrationStatus status) {
        return teachingRegistrationRepository.findByStatus(status).stream()
                .map(mapper::toDto)
                .toList();
    }

    @Override
    public TeachingRegistrationDTO approve(String id) {
        TeachingRegistration entity = teachingRegistrationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingRegistration not found with id " + id));
        entity.setStatus(RegistrationStatus.APPROVED);
        return mapper.toDto(teachingRegistrationRepository.save(entity));
    }

    @Override
    public TeachingRegistrationDTO reject(String id) {
        TeachingRegistration entity = teachingRegistrationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingRegistration not found with id " + id));
        entity.setStatus(RegistrationStatus.REJECTED);
        return mapper.toDto(teachingRegistrationRepository.save(entity));
    }

    @Override
    public void delete(String id) {
        TeachingRegistration entity = teachingRegistrationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingRegistration not found with id " + id));
        teachingRegistrationRepository.delete(entity);
    }
}
