package com.university.schedule.mappers;

import com.university.schedule.dtos.TeachingRegistrationDTO;
import com.university.schedule.entities.TeachingRegistration;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TeachingRegistrationMapper {

    @Mapping(source = "teacher.id", target = "teacherId")
    TeachingRegistrationDTO toDto(TeachingRegistration entity);

    @Mapping(target = "teacher", ignore = true)
    TeachingRegistration toEntity(TeachingRegistrationDTO dto);
}
