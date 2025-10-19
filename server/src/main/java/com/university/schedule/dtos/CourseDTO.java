package com.university.schedule.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseDTO {
    @NotBlank(message = "Id is required")
    private String id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Min teachers is required")
    private Integer minTeachers;

    @NotNull(message = "Max teachers is required")
    private Integer maxTeachers;
}
