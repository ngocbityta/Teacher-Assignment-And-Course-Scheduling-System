package com.university.schedule.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Set;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;    // ví dụ: CS101
    private String name;
    private String department;
    private Integer credits;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private Set<Section> sections;
}
