package com.university.schedule.controllers;

import com.university.schedule.dtos.TimePreferenceDTO;
import com.university.schedule.services.TimePreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/time-preferences")
@RequiredArgsConstructor
public class TimePreferenceController {

    private final TimePreferenceService service;

    @PostMapping
    public TimePreferenceDTO create(@RequestBody TimePreferenceDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    public TimePreferenceDTO getById(@PathVariable String id) {
        return service.getById(id);
    }

    @GetMapping
    public List<TimePreferenceDTO> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}")
    public TimePreferenceDTO update(@PathVariable String id, @RequestBody TimePreferenceDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
