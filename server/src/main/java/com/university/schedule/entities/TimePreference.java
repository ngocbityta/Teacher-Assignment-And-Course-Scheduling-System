package com.university.schedule.entities;

import com.university.schedule.enums.Period;
import com.university.schedule.enums.Semester;
import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;

@Entity
@Table(name = "time_preferences",
    uniqueConstraints = @UniqueConstraint(columnNames = {"teacher_id", "semester", "day", "period"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class TimePreference {

    @Id
    @EqualsAndHashCode.Include
    @Column(name = "id", length = 100)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @Enumerated(EnumType.STRING)
    @Column(name = "semester", nullable = false)
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teaching_registration_id", nullable = false)
    private TeachingRegistration teachingRegistration;

    @Enumerated(EnumType.STRING)
    @Column(name = "day", nullable = false)
    private DayOfWeek day;

    @Enumerated(EnumType.STRING)
    @Column(name = "period", nullable = false)
    private Period period;

    @Column(name = "preference_value")
    private Integer preferenceValue;
}
