package com.university.schedule.services;

import com.university.schedule.dtos.TeachingRegistrationDTO;
import com.university.schedule.enums.RegistrationStatus;

import java.util.List;

public interface TeachingRegistrationService {
    TeachingRegistrationDTO create(TeachingRegistrationDTO dto);

    TeachingRegistrationDTO update(String id, TeachingRegistrationDTO dto);

    TeachingRegistrationDTO getById(String id);

    List<TeachingRegistrationDTO> getAll();
    
    List<TeachingRegistrationDTO> getByStatus(RegistrationStatus status);

    TeachingRegistrationDTO approve(String id);

    TeachingRegistrationDTO reject(String id);

    void delete(String id);
}
