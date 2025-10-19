package com.university.schedule.mappers;

import com.university.schedule.dtos.SectionDTO;
import com.university.schedule.entities.Section;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SectionMapper {
    SectionDTO toDto(Section entity);
    Section toEntity(SectionDTO dto);
}
