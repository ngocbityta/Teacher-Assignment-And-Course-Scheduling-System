package com.university.schedule.controllers;

import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.dtos.ScheduleGenerationResponseDTO;
import com.university.schedule.dtos.ScheduleEvaluationResultDTO;
import com.university.schedule.services.ScheduleGenerationService;
import com.university.schedule.services.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService service;
    private final ScheduleGenerationService generationService;

    @PostMapping
    public ScheduleDTO create(@RequestBody ScheduleDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    public ScheduleDTO getById(@PathVariable String id) {
        return service.getById(id);
    }

    @GetMapping
    public List<ScheduleDTO> getAll(
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String name) {
        if (semester == null) {
            return service.getAll();
        }
        if (name != null && !name.isEmpty()) {
            return service.getBySemesterAndName(semester, name);
        }
        return service.getBySemester(semester);
    }

    @GetMapping("/sets")
    public List<String> getScheduleSets(@RequestParam String semester) {
        return service.getScheduleSets(semester);
    }

    @PutMapping("/{id}")
    public ScheduleDTO update(@PathVariable String id, @RequestBody ScheduleDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }

    @DeleteMapping("/sets")
    public void deleteScheduleSet(@RequestParam String name, @RequestParam String semester) {
        service.deleteByName(semester, name);
    }

    @PostMapping("/generate")
    public ScheduleGenerationResponseDTO generateSchedule(
            @RequestParam String semester, 
            @RequestParam(defaultValue = "heuristic") String algorithm,
            @RequestParam(required = true) String scheduleName) {
        return generationService.generateScheduleWithValue(semester, algorithm, scheduleName);
    }

    @GetMapping("/evaluate")
    public ResponseEntity<ScheduleEvaluationResultDTO> evaluateScheduleValue(
            @RequestParam String semester,
            @RequestParam(required = false) String name) {
        if (name != null && !name.isEmpty()) {
            return ResponseEntity.ok(service.evaluateScheduleValue(semester, name));
        }
        return ResponseEntity.ok(service.evaluateScheduleValue(semester));
    }
}
