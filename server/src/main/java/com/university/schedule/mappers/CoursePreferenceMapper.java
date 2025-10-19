package com.university.schedule.mappers;

import com.university.schedule.dtos.CoursePreferenceDTO;
import com.university.schedule.entities.CoursePreference;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CoursePreferenceMapper {
    @Mapping(source = "semester.id", target = "semesterId")
    @Mapping(source = "teacher.id", target = "teacherId")
    @Mapping(source = "course.id", target = "courseId")
    CoursePreferenceDTO toDto(CoursePreference entity);

    @Mapping(source = "semesterId", target = "semester.id")
    @Mapping(source = "teacherId", target = "teacher.id")
    @Mapping(source = "courseId", target = "course.id")
    CoursePreference toEntity(CoursePreferenceDTO dto);
}
