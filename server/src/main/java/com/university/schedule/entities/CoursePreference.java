package com.university.schedule.entities;

import com.university.schedule.enums.Semester;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_preferences",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"teacher_id", "course_id"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CoursePreference {

    @Id
    @EqualsAndHashCode.Include
    @Column(name = "id", length = 100)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "semester")
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teaching_registration_id", nullable = false, referencedColumnName = "id", columnDefinition = "varchar(100)")
    private TeachingRegistration teachingRegistration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(name = "preference_value")
    private Integer preferenceValue;
}
