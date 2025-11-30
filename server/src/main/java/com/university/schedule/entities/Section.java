package com.university.schedule.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Section {

    @Id
    @EqualsAndHashCode.Include
    @Column(name = "id", length = 100)
    private String id;

    @Column(name = "name")
    private String name;

    @Column(name = "period_required")
    private Integer periodRequired;

    @Column(name = "required_seats")
    private Integer requiredSeats;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
}
