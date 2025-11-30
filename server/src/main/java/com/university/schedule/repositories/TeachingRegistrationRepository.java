package com.university.schedule.repositories;

import com.university.schedule.entities.TeachingRegistration;
import com.university.schedule.enums.RegistrationStatus;
import com.university.schedule.enums.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeachingRegistrationRepository extends JpaRepository<TeachingRegistration, String> {
    List<TeachingRegistration> findByStatus(RegistrationStatus status);
    List<TeachingRegistration> findByStatusAndSemester(RegistrationStatus status, Semester semester);
    Optional<TeachingRegistration> findByTeacherIdAndSemester(String teacherId, Semester semester);
    
    @Query("SELECT tr.teacher.id FROM TeachingRegistration tr WHERE tr.semester = :semester")
    List<String> findTeacherIdsBySemester(@Param("semester") Semester semester);
    
    @Query("SELECT tr.teacher.id FROM TeachingRegistration tr WHERE tr.semester = :semester AND tr.status IN :statuses")
    List<String> findTeacherIdsBySemesterAndStatuses(@Param("semester") Semester semester, @Param("statuses") List<RegistrationStatus> statuses);
}
