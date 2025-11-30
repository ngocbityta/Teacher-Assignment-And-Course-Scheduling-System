package com.university.schedule.entities;

import com.university.schedule.enums.Semester;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "classrooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Classroom {

    @Id
    @EqualsAndHashCode.Include
    @Column(name = "id", length = 100)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "status", length = 50)
    private String status;

    @Enumerated(EnumType.STRING)
    @Column(name = "semester", nullable = false)
    private Semester semester;
}
