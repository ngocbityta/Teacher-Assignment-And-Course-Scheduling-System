package com.university.schedule.mappers;

import com.university.schedule.dtos.CoursePreferenceDTO;
import com.university.schedule.entities.CoursePreference;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CoursePreferenceMapper {

    @Mapping(target = "teacherId", source = "teacher.id")
    @Mapping(target = "courseId", source = "course.id")
    @Mapping(target = "teachingRegistrationId", source = "teachingRegistration.id")
    CoursePreferenceDTO toDto(CoursePreference entity);

    @Mapping(target = "teacher", ignore = true)
    @Mapping(target = "course", ignore = true)
    @Mapping(target = "teachingRegistration", ignore = true)
    CoursePreference toEntity(CoursePreferenceDTO dto);
}
