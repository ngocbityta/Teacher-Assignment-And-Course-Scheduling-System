package com.university.schedule.repositories;

import com.university.schedule.entities.Schedule;
import com.university.schedule.enums.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, String> {
    List<Schedule> findBySemester(Semester semester);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Schedule s WHERE s.semester = :semester")
    void deleteBySemester(@Param("semester") Semester semester);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Schedule s WHERE s.classroom.id = :classroomId AND s.day = :day AND s.period = :period")
    void deleteByClassroomAndDayAndPeriod(@Param("classroomId") String classroomId, 
                                          @Param("day") java.time.DayOfWeek day, 
                                          @Param("period") com.university.schedule.enums.Period period);
}
