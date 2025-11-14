package com.university.schedule.controllers;

import com.university.schedule.dtos.TeacherDTO;
import com.university.schedule.enums.Semester;
import com.university.schedule.services.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    @PostMapping
    public TeacherDTO create(@RequestBody TeacherDTO dto) {
        return teacherService.create(dto);
    }

    @GetMapping("/{id}")
    public TeacherDTO getById(@PathVariable String id) {
        return teacherService.getById(id);
    }

    @GetMapping
    public Page<TeacherDTO> search(@RequestParam(required = false) String keyword,
                                   @RequestParam(required = false) Semester semester,
                                   Pageable pageable) {
        return teacherService.search(keyword, semester, pageable);
    }

    @PutMapping("/{id}")
    public TeacherDTO update(@PathVariable String id, @RequestBody TeacherDTO dto) {
        return teacherService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        teacherService.delete(id);
    }
}
