package com.university.schedule.mappers;

import com.university.schedule.dtos.TimePreferenceDTO;
import com.university.schedule.entities.TimePreference;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {PeriodMapper.class})
public interface TimePreferenceMapper {

    @Mapping(source = "teacher.id", target = "teacherId")
    @Mapping(source = "teachingRegistration.id", target = "teachingRegistrationId")
    @Mapping(source = "period.id", target = "periodId")
    @Mapping(source = "period", target = "period")
    TimePreferenceDTO toDto(TimePreference entity);

    @Mapping(target = "teacher", ignore = true)
    @Mapping(target = "teachingRegistration", ignore = true)
    @Mapping(target = "period", ignore = true)
    TimePreference toEntity(TimePreferenceDTO dto);
}
