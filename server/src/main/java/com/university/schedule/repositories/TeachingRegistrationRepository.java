package com.university.schedule.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.university.schedule.entities.TeachingRegistration;

public interface TeachingRegistrationRepository extends JpaRepository<TeachingRegistration, String> {
}
