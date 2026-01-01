package com.university.schedule.repositories;

import com.university.schedule.entities.Period;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PeriodRepository extends JpaRepository<Period, String> {
    Optional<Period> findByName(String name);
    
    List<Period> findAllByOrderByOrderIndexAsc();
    
    Page<Period> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
    
    @Query("SELECT p FROM Period p WHERE p.orderIndex = :orderIndex")
    Optional<Period> findByOrderIndex(Integer orderIndex);
    
    @Query("SELECT p FROM Period p WHERE " +
           "(p.startTime < :endTime AND p.endTime > :startTime) " +
           "AND (:excludeId IS NULL OR p.id != :excludeId)")
    List<Period> findOverlappingPeriods(LocalTime startTime, LocalTime endTime, String excludeId);
    
    @Query("SELECT p FROM Period p WHERE " +
           "(:excludeId IS NULL OR p.id != :excludeId)")
    List<Period> findAllExcluding(String excludeId);
}

