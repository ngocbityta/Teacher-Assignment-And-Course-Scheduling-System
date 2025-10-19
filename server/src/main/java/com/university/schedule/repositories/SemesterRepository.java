package com.university.schedule.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.university.schedule.entities.Semester;

public interface SemesterRepository extends JpaRepository<Semester, String> {
    Page<Semester> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
}
