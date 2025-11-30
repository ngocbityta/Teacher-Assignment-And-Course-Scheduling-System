package com.university.schedule.mappers;

import com.university.schedule.dtos.SectionDTO;
import com.university.schedule.entities.Section;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SectionMapper {

    @Mapping(target = "courseId", source = "course.id")
    SectionDTO toDto(Section entity);

    @Mapping(target = "course", ignore = true)
    Section toEntity(SectionDTO dto);
}
