package com.university.schedule.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Set;

@Entity
@Table(name = "classrooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;       // tên phòng, ví dụ: A101
    private Integer capacity;
    private String type;       // lecture/lab/etc.

    @OneToMany(mappedBy = "classroom")
    private Set<Schedule> schedules;
}
