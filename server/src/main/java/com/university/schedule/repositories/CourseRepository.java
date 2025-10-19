package com.university.schedule.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.university.schedule.entities.Course;

public interface CourseRepository extends JpaRepository<Course, String> {
    Page<Course> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
}
