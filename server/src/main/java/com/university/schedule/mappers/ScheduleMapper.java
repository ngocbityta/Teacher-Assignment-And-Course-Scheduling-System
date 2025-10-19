package com.university.schedule.mappers;

import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.entities.Schedule;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ScheduleMapper {

    // Entity -> DTO
    @Mapping(source = "teacher.id", target = "teacherId")
    @Mapping(source = "semester.id", target = "semesterId")
    @Mapping(source = "section.id", target = "sectionId")
    @Mapping(source = "classroom.id", target = "classroomId")
    ScheduleDTO toDto(Schedule entity);

    // DTO -> Entity
    @Mapping(target = "teacher", ignore = true)    // set trong service
    @Mapping(target = "semester", ignore = true)   // set trong service
    @Mapping(target = "section", ignore = true)    // set trong service
    @Mapping(target = "classroom", ignore = true)  // set trong service
    Schedule toEntity(ScheduleDTO dto);
}
