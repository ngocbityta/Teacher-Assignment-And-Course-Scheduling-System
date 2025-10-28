package com.university.schedule.services;

import com.university.schedule.dtos.TeachingRegistrationDTO;

import java.util.List;

public interface TeachingRegistrationService {
    TeachingRegistrationDTO create(TeachingRegistrationDTO dto);

    TeachingRegistrationDTO update(String id, TeachingRegistrationDTO dto);

    TeachingRegistrationDTO getById(String id);

    List<TeachingRegistrationDTO> getAll();

    void delete(String id);
}
