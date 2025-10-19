package com.university.schedule.repositories;

import com.university.schedule.entities.TimePreference;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TimePreferenceRepository extends JpaRepository<TimePreference, String> {
}
