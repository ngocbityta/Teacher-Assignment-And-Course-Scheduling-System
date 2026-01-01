package com.university.schedule.entities;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teachers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Teacher {

    @Id
    @EqualsAndHashCode.Include
    @Column(name = "id", length = 100)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "semester", nullable = false)
    private String semester;

    @Column(name = "avatar", length = 500)
    private String avatar;
}
