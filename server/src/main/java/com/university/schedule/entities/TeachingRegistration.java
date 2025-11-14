package com.university.schedule.entities;

import com.university.schedule.enums.RegistrationStatus;
import com.university.schedule.enums.Semester;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teaching_registrations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"teacher_id", "semester"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class TeachingRegistration {

    @Id
    @EqualsAndHashCode.Include
    @Column(name = "id", length = 100)
    private String id;

    @ManyToOne
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @Enumerated(EnumType.STRING)
    @Column(name = "semester", nullable = false)
    private Semester semester;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RegistrationStatus status;

    @Column(name = "max_courses")
    private Integer maxCourses;
}
