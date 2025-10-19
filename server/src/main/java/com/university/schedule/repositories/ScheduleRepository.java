package com.university.schedule.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.university.schedule.entities.Schedule;

public interface ScheduleRepository extends JpaRepository<Schedule, String> {
}
