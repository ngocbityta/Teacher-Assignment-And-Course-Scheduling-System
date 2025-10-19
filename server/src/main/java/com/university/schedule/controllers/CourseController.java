package com.university.schedule.controllers;

import com.university.schedule.dtos.CourseDTO;
import com.university.schedule.services.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    public CourseDTO create(@RequestBody CourseDTO dto) {
        return courseService.create(dto);
    }

    @GetMapping("/{id}")
    public CourseDTO getById(@PathVariable String id) {
        return courseService.getById(id);
    }

    @GetMapping
    public Page<CourseDTO> search(@RequestParam(required = false) String keyword,
                                  Pageable pageable) {
        return courseService.search(keyword, pageable);
    }

    @PutMapping("/{id}")
    public CourseDTO update(@PathVariable String id, @RequestBody CourseDTO dto) {
        return courseService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        courseService.delete(id);
    }
}
