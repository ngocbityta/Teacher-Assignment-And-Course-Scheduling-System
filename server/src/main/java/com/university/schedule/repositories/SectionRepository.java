package com.university.schedule.repositories;

import com.university.schedule.entities.Section;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SectionRepository extends JpaRepository<Section, String> {
    Page<Section> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
    Page<Section> findByIdEndingWith(String suffix, Pageable pageable);
    Page<Section> findByNameContainingIgnoreCaseAndIdEndingWith(String keyword, String suffix, Pageable pageable);
}
