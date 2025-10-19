package com.university.schedule.repositories;

import com.university.schedule.entities.CoursePreference;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoursePreferenceRepository extends JpaRepository<CoursePreference, String> {
}
