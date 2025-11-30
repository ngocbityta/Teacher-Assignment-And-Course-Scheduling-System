package com.university.schedule.mappers;

import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.entities.Schedule;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ScheduleMapper {

    @Mapping(source = "teacher.id", target = "teacherId")
    @Mapping(source = "section.id", target = "sectionId")
    @Mapping(source = "classroom.id", target = "classroomId")
    ScheduleDTO toDto(Schedule entity);

    @Mapping(target = "teacher", ignore = true)
    @Mapping(target = "section", ignore = true)
    @Mapping(target = "classroom", ignore = true)
    Schedule toEntity(ScheduleDTO dto);
}
