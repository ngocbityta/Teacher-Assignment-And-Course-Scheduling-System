package com.university.schedule.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.university.schedule.entities.Classroom;

public interface ClassroomRepository extends JpaRepository<Classroom, String> {
    Page<Classroom> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
}
