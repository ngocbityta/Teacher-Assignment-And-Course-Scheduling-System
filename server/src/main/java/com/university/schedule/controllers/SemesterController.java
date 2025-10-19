package com.university.schedule.controllers;

import com.university.schedule.dtos.SemesterDTO;
import com.university.schedule.services.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    @PostMapping
    public SemesterDTO create(@RequestBody SemesterDTO dto) {
        return semesterService.create(dto);
    }

    @GetMapping("/{id}")
    public SemesterDTO getById(@PathVariable String id) {
        return semesterService.getById(id);
    }

    @GetMapping
    public Page<SemesterDTO> search(@RequestParam(required = false) String keyword,
                                    Pageable pageable) {
        return semesterService.search(keyword, pageable);
    }

    @PutMapping("/{id}")
    public SemesterDTO update(@PathVariable String id, @RequestBody SemesterDTO dto) {
        return semesterService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        semesterService.delete(id);
    }
}
