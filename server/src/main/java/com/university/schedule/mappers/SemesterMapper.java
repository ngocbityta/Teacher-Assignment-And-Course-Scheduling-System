package com.university.schedule.mappers;

import com.university.schedule.dtos.SemesterDTO;
import com.university.schedule.entities.Semester;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SemesterMapper {
    SemesterDTO toDto(Semester entity);
    Semester toEntity(SemesterDTO dto);
}
