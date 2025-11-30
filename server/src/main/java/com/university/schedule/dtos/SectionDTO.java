package com.university.schedule.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionDTO {
    @NotBlank(message = "Id is required")
    private String id;

    @NotBlank(message = "Course ID is required")
    private String courseId;

    @NotNull(message = "Number of required period cannot be null")
    private Integer periodRequired;

    @NotNull(message = "Number of required seats cannot be null")
    private Integer requiredSeats;

    @NotBlank(message = "Name is required")
    private String name;
}
