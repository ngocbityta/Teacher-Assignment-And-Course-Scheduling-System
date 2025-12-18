package com.university.schedule.mappers;

import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.entities.Schedule;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ScheduleMapper {

    @Mapping(source = "teacher.id", target = "teacherId")
    @Mapping(source = "teacher.name", target = "teacherName")
    @Mapping(source = "section.id", target = "sectionId")
    @Mapping(source = "section.name", target = "sectionName")
    @Mapping(source = "classroom.id", target = "classroomId")
    @Mapping(source = "classroom.name", target = "classroomName")
    @Mapping(target = "semester", expression = "java(entity.getSemester() != null ? entity.getSemester().name() : null)")
    ScheduleDTO toDto(Schedule entity);

    @Mapping(target = "teacher", ignore = true)
    @Mapping(target = "section", ignore = true)
    @Mapping(target = "classroom", ignore = true)
    @Mapping(target = "semester", ignore = true)
    Schedule toEntity(ScheduleDTO dto);
}
