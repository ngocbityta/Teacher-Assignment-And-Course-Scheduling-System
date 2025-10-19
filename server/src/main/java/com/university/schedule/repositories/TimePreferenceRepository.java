package com.university.schedule.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.university.schedule.entities.TimePreference;

public interface TimePreferenceRepository extends JpaRepository<TimePreference, String> {
}
