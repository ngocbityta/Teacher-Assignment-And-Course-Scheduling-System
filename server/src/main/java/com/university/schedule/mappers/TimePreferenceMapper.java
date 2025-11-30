package com.university.schedule.mappers;

import com.university.schedule.dtos.TimePreferenceDTO;
import com.university.schedule.entities.TimePreference;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TimePreferenceMapper {

    @Mapping(source = "teacher.id", target = "teacherId")
    @Mapping(source = "teachingRegistration.id", target = "teachingRegistrationId")
    TimePreferenceDTO toDto(TimePreference entity);

    @Mapping(target = "teacher", ignore = true)
    @Mapping(target = "teachingRegistration", ignore = true)
    TimePreference toEntity(TimePreferenceDTO dto);
}
