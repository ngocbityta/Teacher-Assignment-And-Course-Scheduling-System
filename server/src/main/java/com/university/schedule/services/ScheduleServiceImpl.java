package com.university.schedule.services;

import com.university.schedule.dtos.AssignmentDTO;
import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.dtos.ScheduleEvaluationResultDTO;
import com.university.schedule.entities.*;
import com.university.schedule.exceptions.NotFoundException;
import com.university.schedule.mappers.ScheduleJsonMapper;
import com.university.schedule.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Transactional
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository repository;
    private final ScheduleJsonMapper jsonMapper;
    private final SectionRepository sectionRepository;
    private final PeriodRepository periodRepository;
    private final CoursePreferenceRepository coursePreferenceRepository;
    private final TimePreferenceRepository timePreferenceRepository;

    @Override
    public ScheduleDTO create(ScheduleDTO dto) {
        if (repository.existsById(dto.getId())) {
            throw new IllegalArgumentException("Schedule already exists with id " + dto.getId());
        }

        String semester = dto.getSemester();
        Schedule entity = jsonMapper.toEntity(dto);
        entity.setSemester(semester);

        return jsonMapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public ScheduleDTO getById(String id) {
        Schedule entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Schedule not found with id " + id));
        return jsonMapper.toDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleDTO> getAll() {
        return repository.findAll().stream().map(jsonMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public ScheduleDTO update(String id, ScheduleDTO dto) {
        // Verify schedule exists
        if (!repository.existsById(id)) {
            throw new NotFoundException("Schedule not found with id " + id);
        }

        String semester = dto.getSemester();
        
        // Update entity from DTO (JSON fields will be converted)
        Schedule updatedEntity = jsonMapper.toEntity(dto);
        updatedEntity.setId(id);
        updatedEntity.setSemester(semester);

        return jsonMapper.toDto(repository.save(updatedEntity));
    }

    @Override
    public void delete(String id) {
        Schedule entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Schedule not found with id " + id));
        repository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleDTO> getBySemester(String semester) {
        return repository.findBySemester(semester).stream()
                .map(jsonMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleDTO> getBySemesterAndName(String semester, String name) {
        return repository.findBySemesterAndName(semester, name).stream()
                .map(jsonMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getScheduleSets(String semester) {
        return repository.findDistinctNamesBySemester(semester);
    }

    @Override
    public void deleteByName(String semester, String name) {
        repository.deleteBySemesterAndName(semester, name);
    }

    @Override
    @Transactional(readOnly = true)
    public ScheduleEvaluationResultDTO evaluateScheduleValue(String semester, String name) {
        List<Schedule> schedules;
        if (name != null && !name.isEmpty()) {
            schedules = repository.findBySemesterAndName(semester, name);
        } else {
            schedules = repository.findBySemester(semester);
        }
        return evaluateSchedules(schedules, semester);
    }

    @Override
    @Transactional(readOnly = true)
    public ScheduleEvaluationResultDTO evaluateScheduleValue(String semester) {
        List<Schedule> schedules = repository.findBySemester(semester);
        return evaluateSchedules(schedules, semester);
    }

    private ScheduleEvaluationResultDTO evaluateSchedules(List<Schedule> schedules, String semester) {
        if (schedules.isEmpty()) {
            return ScheduleEvaluationResultDTO.builder()
                .totalScore(0.0)
                .workloadPenalty(0.0)
                .compactnessPenalty(0.0)
                .coursePreferenceScore(0.0)
                .timePreferenceScore(0.0)
                .build();
        }

        double totalScore = 0.0;
        double coursePreferenceScore = 0.0;
        double timePreferenceScore = 0.0;
        double workloadPenalty = 0.0;
        double compactnessPenalty = 0.0;
        
        // Constants matching C++ Phase 3
        final double W_COURSE_PREF = 1.0;
        final double W_TIME_PREF = 1.0;
        final double W_WORKLOAD_BALANCE = 5.0;
        final double W_COMPACTNESS = 3.0;

        // Data structures for calculations
        Map<String, Double> teacherWorkloads = new HashMap<>(); // teacherId -> total periods
        Map<String, Map<DayOfWeek, List<Integer>>> teacherDayPeriods = new HashMap<>(); // teacherId -> day -> list of period indices

        // Get all time preferences for efficiency
        List<TimePreference> allTimePreferences = timePreferenceRepository.findAll().stream()
                .filter(tp -> tp.getSemester().equals(semester))
                .collect(Collectors.toList());
        
        // Build time preference lookup map: teacherId -> (day, periodId) -> value
        Map<String, Map<String, Integer>> timePrefMap = new HashMap<>();
        for (TimePreference tp : allTimePreferences) {
            String teacherId = tp.getTeacher().getId();
            String key = tp.getDay().toString() + "|" + tp.getPeriod().getId();
            timePrefMap.computeIfAbsent(teacherId, k -> new HashMap<>()).put(key, 
                    tp.getPreferenceValue() != null ? tp.getPreferenceValue() : 0);
        }

        // Pre-fetch course preferences
        List<CoursePreference> allCoursePreferences = coursePreferenceRepository.findAll().stream()
                .filter(cp -> cp.getSemester().equals(semester))
                .filter(cp -> cp.getCourse() != null)
                .collect(Collectors.toList());
        
        Map<String, Map<String, Integer>> coursePrefMap = new HashMap<>();
        for (CoursePreference cp : allCoursePreferences) {
            String teacherId = cp.getTeacher().getId();
            String courseId = cp.getCourse().getId();
            coursePrefMap.computeIfAbsent(teacherId, k -> new HashMap<>()).put(courseId,
                    cp.getPreferenceValue() != null ? cp.getPreferenceValue() : 0);
        }

        // Get all periods ordered by orderIndex for compactness calculation
        List<Period> allPeriods = periodRepository.findAllByOrderByOrderIndexAsc();
        Map<String, Integer> periodIdToIndex = new HashMap<>();
        for (int i = 0; i < allPeriods.size(); i++) {
            periodIdToIndex.put(allPeriods.get(i).getId(), i);
        }

        // Process assignments from JSON
        for (Schedule schedule : schedules) {
            ScheduleDTO scheduleDTO = jsonMapper.toDto(schedule);
            if (scheduleDTO.getAssignments() == null || scheduleDTO.getAssignments().isEmpty()) {
                continue;
            }

            for (AssignmentDTO assignment : scheduleDTO.getAssignments()) {
                String teacherId = assignment.getTeacherId();
                String sectionId = assignment.getSectionId();
                DayOfWeek day = parseDayOfWeek(assignment.getDay());
                int periodOrder = Integer.parseInt(assignment.getPeriod());

                // Get section to find course
                Section section = sectionRepository.findById(sectionId).orElse(null);
                if (section == null || section.getCourse() == null) {
                    continue;
                }
                String courseId = section.getCourse().getId();

                Integer duration = section.getPeriodRequired() != null ? section.getPeriodRequired() : 1;

                // 1. Course Preference (Applied once per assignment)
                Map<String, Integer> teacherCoursePrefs = coursePrefMap.get(teacherId);
                if (teacherCoursePrefs != null) {
                    Integer pref = teacherCoursePrefs.get(courseId);
                    if (pref != null) {
                        coursePreferenceScore += W_COURSE_PREF * pref;
                    }
                }

                // Loop through all periods of the section for other metrics
                for (int i = 0; i < duration; i++) {
                    int currentPeriodOrder = periodOrder + i;

                    Period period = allPeriods.stream()
                            .filter(p -> p.getOrderIndex() == currentPeriodOrder)
                            .findFirst()
                            .orElse(null);
                    
                    if (period != null) {
                        Integer periodIdx = periodIdToIndex.get(period.getId());
                        
                        if (periodIdx != null) {
                            // 2. Time Preference (Sum of prefs for all covered periods)
                            Map<String, Integer> teacherTimePrefs = timePrefMap.get(teacherId);
                            if (teacherTimePrefs != null) {
                                String key = day.toString() + "|" + period.getId();
                                Integer timePrefValue = teacherTimePrefs.get(key);
                                if (timePrefValue != null) {
                                    timePreferenceScore += W_TIME_PREF * timePrefValue;
                                }
                            }

                            // Collect data for Workload (each period adds to custom workload)
                            teacherWorkloads.merge(teacherId, 1.0, Double::sum);

                            // Collect data for Compactness
                            teacherDayPeriods
                                .computeIfAbsent(teacherId, k -> new HashMap<>())
                                .computeIfAbsent(day, k -> new ArrayList<>())
                                .add(periodIdx);
                        }
                    }
                }
            }
        }

        // 3. Workload Balance (minimize Range: Max - Min)
        // C++ Logic: Penalty = (Max_Workload - Min_Workload) * W
        if (!teacherWorkloads.isEmpty() && teacherWorkloads.size() > 1) {
            DoubleSummaryStatistics stats = teacherWorkloads.values().stream()
                .mapToDouble(Double::doubleValue)
                .summaryStatistics();
            
            workloadPenalty = W_WORKLOAD_BALANCE * (stats.getMax() - stats.getMin());
        }

        // 4. Compactness (minimize transitions from Class to No-Class)
        // C++ Logic: For each day, for m in 0..M-2: if has_class[m] and !has_class[m+1] -> penalty.
        // This is asymmetrical
        double totalCompactness = 0.0;
        int M = allPeriods.size(); // Total periods per day

        for (String teacherId : teacherDayPeriods.keySet()) {
            Map<DayOfWeek, List<Integer>> days = teacherDayPeriods.get(teacherId);
            
            for (DayOfWeek day : days.keySet()) {
                List<Integer> periods = days.get(day);
                if (periods == null || periods.isEmpty()) continue; // No penalty for empty days

                // Build boolean array for the day
                boolean[] hasClass = new boolean[M];
                for (Integer pIdx : periods) {
                    if (pIdx >= 0 && pIdx < M) {
                        hasClass[pIdx] = true;
                    }
                }

                // Count gaps (Class -> No Class transitions)
                // Loop only up to M-2 (comparing m and m+1)
                for (int m = 0; m < M - 1; m++) {
                    if (hasClass[m] && !hasClass[m+1]) {
                        totalCompactness += 1.0;
                    }
                }
            }
        }
        compactnessPenalty = W_COMPACTNESS * totalCompactness;
        
        totalScore = coursePreferenceScore + timePreferenceScore - workloadPenalty - compactnessPenalty;

        return ScheduleEvaluationResultDTO.builder()
                .totalScore(totalScore)
                .workloadPenalty(workloadPenalty)
                .compactnessPenalty(compactnessPenalty)
                .coursePreferenceScore(coursePreferenceScore)
                .timePreferenceScore(timePreferenceScore)
                .build();
    }

    private DayOfWeek parseDayOfWeek(String dayStr) {
        switch (dayStr.toLowerCase()) {
            case "mon": return DayOfWeek.MONDAY;
            case "tue": return DayOfWeek.TUESDAY;
            case "wed": return DayOfWeek.WEDNESDAY;
            case "thu": return DayOfWeek.THURSDAY;
            case "fri": return DayOfWeek.FRIDAY;
            case "sat": return DayOfWeek.SATURDAY;
            case "sun": return DayOfWeek.SUNDAY;
            default: return DayOfWeek.valueOf(dayStr.toUpperCase());
        }
    }
}
