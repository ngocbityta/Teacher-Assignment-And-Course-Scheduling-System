package com.university.schedule.repositories;

import com.university.schedule.entities.TeachingRegistration;
import com.university.schedule.enums.RegistrationStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeachingRegistrationRepository extends JpaRepository<TeachingRegistration, String> {
    List<TeachingRegistration> findByStatus(RegistrationStatus status);
    List<TeachingRegistration> findByStatusAndSemester(RegistrationStatus status, String semester);
    Optional<TeachingRegistration> findByTeacherIdAndSemester(String teacherId, String semester);
    
    @Query("SELECT tr.teacher.id FROM TeachingRegistration tr WHERE tr.semester = :semester")
    List<String> findTeacherIdsBySemester(@Param("semester") String semester);
    
    @Query("SELECT tr.teacher.id FROM TeachingRegistration tr WHERE tr.semester = :semester AND tr.status IN :statuses")
    List<String> findTeacherIdsBySemesterAndStatuses(@Param("semester") String semester, @Param("statuses") List<RegistrationStatus> statuses);
}
