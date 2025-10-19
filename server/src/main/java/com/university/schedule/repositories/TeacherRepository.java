package com.university.schedule.repositories;

import com.university.schedule.entities.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherRepository extends JpaRepository<Teacher, String> {
    Page<Teacher> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
