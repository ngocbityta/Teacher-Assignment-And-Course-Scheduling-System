package com.university.schedule.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.university.schedule.entities.Teacher;

public interface TeacherRepository extends JpaRepository<Teacher, String> {
    Page<Teacher> findByNameContainingIgnoreCase(String name, Pageable pageable);
    Page<Teacher> findBySemester(String semester, Pageable pageable);
    Page<Teacher> findByNameContainingIgnoreCaseAndSemester(String name, String semester, Pageable pageable);
}
