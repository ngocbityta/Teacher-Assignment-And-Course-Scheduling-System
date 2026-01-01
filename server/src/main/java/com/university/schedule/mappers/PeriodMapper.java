package com.university.schedule.mappers;

import com.university.schedule.dtos.PeriodDTO;
import com.university.schedule.entities.Period;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PeriodMapper {
    PeriodDTO toDto(Period entity);
    Period toEntity(PeriodDTO dto);
}


