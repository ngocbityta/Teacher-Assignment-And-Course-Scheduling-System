package com.university.schedule.repositories;

import com.university.schedule.entities.Schedule;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, String> {
    List<Schedule> findBySemester(String semester);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Schedule s WHERE s.semester = :semester")
    void deleteBySemester(@Param("semester") String semester);
    
    // This method is no longer needed as we store assignments as JSON
    // Keeping for backward compatibility but not used

    // Schedule versioning methods
    List<Schedule> findBySemesterAndName(String semester, String name);
    
    @Query("SELECT DISTINCT s.name FROM Schedule s WHERE s.semester = :semester AND s.name IS NOT NULL ORDER BY s.name")
    List<String> findDistinctNamesBySemester(@Param("semester") String semester);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Schedule s WHERE s.semester = :semester AND s.name = :name")
    void deleteBySemesterAndName(@Param("semester") String semester, @Param("name") String name);
}
