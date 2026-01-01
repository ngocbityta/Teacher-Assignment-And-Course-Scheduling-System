package com.university.schedule.entities;


import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import lombok.*;

@Entity
@Table(name = "schedules",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"name", "semester"})
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

    @Column(name = "semester", nullable = false)
    private String semester;

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "assignments", columnDefinition = "jsonb")
    private String assignments; // JSON array of assignments

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "statistics", columnDefinition = "jsonb")
    private String statistics; // JSON object with statistics

    @Column(name = "objective_value")
    private Integer objectiveValue;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "penalties", columnDefinition = "jsonb")
    private String penalties; // JSON object with penalty details

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scores", columnDefinition = "jsonb")
    private String scores; // JSON object with score details

}
