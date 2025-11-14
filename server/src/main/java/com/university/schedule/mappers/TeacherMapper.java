package com.university.schedule.mappers;

import com.university.schedule.dtos.TeacherDTO;
import com.university.schedule.entities.Teacher;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TeacherMapper {
    TeacherDTO toDto(Teacher entity);

    Teacher toEntity(TeacherDTO dto);
}

