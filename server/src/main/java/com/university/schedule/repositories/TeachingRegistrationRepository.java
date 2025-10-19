package com.university.schedule.repositories;

import com.university.schedule.entities.TeachingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeachingRegistrationRepository extends JpaRepository<TeachingRegistration, String> {
}
