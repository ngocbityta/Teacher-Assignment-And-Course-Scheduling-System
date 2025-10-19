package com.university.schedule.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.university.schedule.entities.CoursePreference;

public interface CoursePreferenceRepository extends JpaRepository<CoursePreference, String> {
}
