package com.university.schedule.entities;

import com.university.schedule.enums.Period;
import jakarta.persistence.*;

import java.time.DayOfWeek;

import lombok.*;

@Entity
@Table(name = "schedules",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"section_id", "day", "period_id"}),
                @UniqueConstraint(columnNames = {"room_id", "day", "period_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Schedule {

    @Id
    @EqualsAndHashCode.Include
    @Column(name = "id", length = 100)
    private String id;

    @ManyToOne
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @ManyToOne
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    private Classroom classroom;

    // as above for TimePreference; add @Enumerated if you want STRING storage
    @Column(name = "day", nullable = false)
    private DayOfWeek day;

    @Enumerated(EnumType.STRING)
    @Column(name = "period", nullable = false)
    private Period period;

}
