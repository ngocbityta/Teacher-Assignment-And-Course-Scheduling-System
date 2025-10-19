package com.university.schedule.controllers;

import com.university.schedule.dtos.SectionDTO;
import com.university.schedule.services.SectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;

    @PostMapping
    public SectionDTO create(@RequestBody SectionDTO dto) {
        return sectionService.create(dto);
    }

    @GetMapping("/{id}")
    public SectionDTO getById(@PathVariable String id) {
        return sectionService.getById(id);
    }

    @GetMapping
    public Page<SectionDTO> search(@RequestParam(required = false) String keyword,
                                   Pageable pageable) {
        return sectionService.search(keyword, pageable);
    }

    @PutMapping("/{id}")
    public SectionDTO update(@PathVariable String id, @RequestBody SectionDTO dto) {
        return sectionService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        sectionService.delete(id);
    }
}
