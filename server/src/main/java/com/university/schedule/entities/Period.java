package com.university.schedule.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "periods",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"name"}),
        @UniqueConstraint(columnNames = {"order_index"})
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Period {

    @Id
    @EqualsAndHashCode.Include
    @Column(name = "id", length = 100)
    private String id;

    @NotBlank
    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    @NotNull
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @NotNull
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @NotNull
    @Column(name = "order_index", nullable = false, unique = true)
    private Integer orderIndex;

    @Column(name = "description", length = 255)
    private String description;
}



