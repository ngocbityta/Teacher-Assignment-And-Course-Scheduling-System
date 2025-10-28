package com.university.schedule.controllers;

import com.university.schedule.dtos.TeachingRegistrationDTO;
import com.university.schedule.services.TeachingRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teaching-registrations")
@RequiredArgsConstructor
public class TeachingRegistrationController {

    private final TeachingRegistrationService service;

    @PostMapping
    public TeachingRegistrationDTO create(@Valid @RequestBody TeachingRegistrationDTO dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public TeachingRegistrationDTO update(@PathVariable String id,
                                          @Valid @RequestBody TeachingRegistrationDTO dto) {
        return service.update(id, dto);
    }

    @GetMapping("/{id}")
    public TeachingRegistrationDTO getById(@PathVariable String id) {
        return service.getById(id);
    }

    @GetMapping
    public List<TeachingRegistrationDTO> getAll() {
        return service.getAll();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
