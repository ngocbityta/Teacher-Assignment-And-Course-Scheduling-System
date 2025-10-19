package com.university.schedule.mappers;

import com.university.schedule.dtos.CourseDTO;
import com.university.schedule.entities.Course;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CourseMapper {
    CourseDTO toDto(Course entity);
    Course toEntity(CourseDTO dto);
}
