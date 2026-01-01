package com.university.schedule.controllers;

import com.university.schedule.dtos.PeriodDTO;
import com.university.schedule.services.PeriodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/periods")
@RequiredArgsConstructor
public class PeriodController {

    private final PeriodService periodService;

    @PostMapping
    public ResponseEntity<PeriodDTO> create(@Valid @RequestBody PeriodDTO dto) {
        PeriodDTO created = periodService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PeriodDTO> getById(@PathVariable String id) {
        PeriodDTO dto = periodService.getById(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public ResponseEntity<List<PeriodDTO>> getAll() {
        List<PeriodDTO> periods = periodService.getAll();
        return ResponseEntity.ok(periods);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PeriodDTO>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PeriodDTO> page = periodService.search(keyword, pageable);
        return ResponseEntity.ok(page);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PeriodDTO> update(
            @PathVariable String id,
            @Valid @RequestBody PeriodDTO dto) {
        PeriodDTO updated = periodService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        periodService.delete(id);
        return ResponseEntity.noContent().build();
    }
}


