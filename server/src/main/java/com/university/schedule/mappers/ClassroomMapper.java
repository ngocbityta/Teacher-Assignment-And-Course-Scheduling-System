package com.university.schedule.mappers;

import com.university.schedule.dtos.ClassroomDTO;
import com.university.schedule.entities.Classroom;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ClassroomMapper {
    ClassroomDTO toDto(Classroom entity);
    Classroom toEntity(ClassroomDTO dto);
}
