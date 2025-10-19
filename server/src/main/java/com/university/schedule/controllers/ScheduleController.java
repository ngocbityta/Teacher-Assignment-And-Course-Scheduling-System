package com.university.schedule.controllers;

import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.services.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService service;

    @PostMapping
    public ScheduleDTO create(@RequestBody ScheduleDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    public ScheduleDTO getById(@PathVariable String id) {
        return service.getById(id);
    }

    @GetMapping
    public List<ScheduleDTO> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}")
    public ScheduleDTO update(@PathVariable String id, @RequestBody ScheduleDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
