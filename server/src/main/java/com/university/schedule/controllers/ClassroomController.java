package com.university.schedule.controllers;

import com.university.schedule.dtos.ClassroomDTO;

import com.university.schedule.services.ClassroomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @PostMapping
    public ClassroomDTO create(@RequestBody ClassroomDTO dto) {
        return classroomService.create(dto);
    }

    @GetMapping("/{id}")
    public ClassroomDTO getById(@PathVariable String id) {
        return classroomService.getById(id);
    }

    @GetMapping
    public Page<ClassroomDTO> search(@RequestParam(required = false) String keyword,
                                     @RequestParam(required = false) String semester,
                                     Pageable pageable) {
        return classroomService.search(keyword, semester, pageable);
    }

    @PutMapping("/{id}")
    public ClassroomDTO update(@PathVariable String id, @RequestBody ClassroomDTO dto) {
        return classroomService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        classroomService.delete(id);
    }
}
