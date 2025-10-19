package com.university.schedule.controllers;

import com.university.schedule.dtos.CoursePreferenceDTO;
import com.university.schedule.services.CoursePreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-preferences")
@RequiredArgsConstructor
public class CoursePreferenceController {

    private final CoursePreferenceService service;

    @PostMapping
    public CoursePreferenceDTO create(@RequestBody CoursePreferenceDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    public CoursePreferenceDTO getById(@PathVariable String id) {
        return service.getById(id);
    }

    @GetMapping
    public List<CoursePreferenceDTO> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}")
    public CoursePreferenceDTO update(@PathVariable String id, @RequestBody CoursePreferenceDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
