package com.university.schedule.services;

import com.university.schedule.dtos.PeriodDTO;
import com.university.schedule.entities.Period;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.PeriodMapper;
import com.university.schedule.repositories.PeriodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Transactional
public class PeriodServiceImpl implements PeriodService {

    private final PeriodRepository periodRepository;
    private final PeriodMapper periodMapper;

    @Override
    public PeriodDTO create(PeriodDTO dto) {
        // Validate time range
        validateTimeRange(dto.getStartTime(), dto.getEndTime());
        
        // Check for conflicts (overlapping or less than 30 minutes apart)
        validateNoConflicts(dto.getStartTime(), dto.getEndTime(), null);
        
        // Check if name already exists
        if (periodRepository.findByName(dto.getName()).isPresent()) {
            throw new IllegalArgumentException("Period with name '" + dto.getName() + "' already exists");
        }
        
        // Check if order index already exists
        if (periodRepository.findByOrderIndex(dto.getOrderIndex()).isPresent()) {
            throw new IllegalArgumentException("Period with order index " + dto.getOrderIndex() + " already exists");
        }
        
        Period period = periodMapper.toEntity(dto);
        period.setId(UUID.randomUUID().toString());
        Period saved = periodRepository.save(period);
        return periodMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PeriodDTO getById(String id) {
        Period entity = periodRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Period not found with id " + id));
        return periodMapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PeriodDTO> getAll() {
        return periodRepository.findAllByOrderByOrderIndexAsc().stream()
                .map(periodMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PeriodDTO> search(String keyword, Pageable pageable) {
        Page<Period> page;
        if (keyword == null || keyword.isBlank()) {
            page = periodRepository.findAll(pageable);
        } else {
            page = periodRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
        }
        return page.map(periodMapper::toDto);
    }

    @Override
    public PeriodDTO update(String id, PeriodDTO dto) {
        Period entity = periodRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Period not found with id " + id));
        
        // Validate time range
        validateTimeRange(dto.getStartTime(), dto.getEndTime());
        
        // Check for conflicts (excluding current period)
        validateNoConflicts(dto.getStartTime(), dto.getEndTime(), id);
        
        // Check if name already exists (excluding current)
        periodRepository.findByName(dto.getName()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Period with name '" + dto.getName() + "' already exists");
            }
        });
        
        // Check if order index already exists (excluding current)
        periodRepository.findByOrderIndex(dto.getOrderIndex()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Period with order index " + dto.getOrderIndex() + " already exists");
            }
        });
        
        entity.setName(dto.getName());
        entity.setStartTime(dto.getStartTime());
        entity.setEndTime(dto.getEndTime());
        entity.setOrderIndex(dto.getOrderIndex());
        entity.setDescription(dto.getDescription());
        
        Period saved = periodRepository.save(entity);
        return periodMapper.toDto(saved);
    }

    @Override
    public void delete(String id) {
        Period entity = periodRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Period not found with id " + id));
        
        // Check if period is used in schedules or time preferences
        // This will be handled by database foreign key constraints
        periodRepository.delete(entity);
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (startTime.isAfter(endTime) || startTime.equals(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
    }

    private void validateNoConflicts(LocalTime startTime, LocalTime endTime, String excludeId) {
        // Check for overlapping periods
        List<Period> overlapping = periodRepository.findOverlappingPeriods(startTime, endTime, excludeId);
        if (!overlapping.isEmpty()) {
            Period conflict = overlapping.get(0);
            throw new IllegalArgumentException(
                    String.format("Period overlaps with '%s' (%s - %s). Periods must not overlap.",
                            conflict.getName(), conflict.getStartTime(), conflict.getEndTime())
            );
        }
        
        // Check for periods that are less than 30 minutes apart
        List<Period> allPeriods = excludeId == null 
                ? periodRepository.findAll() 
                : periodRepository.findAllExcluding(excludeId);
        final long MIN_GAP_MINUTES = 30;
        
        for (Period existing : allPeriods) {
            if (excludeId != null && existing.getId().equals(excludeId)) {
                continue;
            }
            
            // Calculate gap between periods
            long gapBefore = Duration.between(existing.getEndTime(), startTime).toMinutes();
            long gapAfter = Duration.between(endTime, existing.getStartTime()).toMinutes();
            
            // If periods are adjacent or very close (less than 30 minutes apart)
            if ((gapBefore >= 0 && gapBefore < MIN_GAP_MINUTES) || 
                (gapAfter >= 0 && gapAfter < MIN_GAP_MINUTES)) {
                throw new IllegalArgumentException(
                        String.format("Period conflicts with '%s' (%s - %s). Periods must be at least 30 minutes apart.",
                                existing.getName(), existing.getStartTime(), existing.getEndTime())
                );
            }
        }
    }
}

