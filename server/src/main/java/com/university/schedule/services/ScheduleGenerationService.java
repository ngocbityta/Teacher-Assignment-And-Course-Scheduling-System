package com.university.schedule.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.dtos.ScheduleGenerationResponseDTO;
import com.university.schedule.entities.*;
import com.university.schedule.enums.Period;
import com.university.schedule.enums.RegistrationStatus;
import com.university.schedule.enums.Semester;
import com.university.schedule.mappers.ScheduleMapper;
import com.university.schedule.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;

import java.time.DayOfWeek;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleGenerationService {

    private static final List<String> WEEKDAYS = Arrays.asList("Mon", "Tue", "Wed", "Thu", "Fri");
    private static final int DEFAULT_MAX_COURSES = 1;
    private static final int DEFAULT_MIN_TEACHERS = 1;
    private static final int DEFAULT_MAX_TEACHERS = 10; // Default max teachers if not specified
    private static final int DEFAULT_REQUIRED_PERIODS = 1;
    private static final int DEFAULT_REQUIRED_SEATS = 0;
    private static final int DEFAULT_PREFERENCE_VALUE = 0;
    private static final int DEFAULT_CAPACITY = 0;

    private final ResearchService researchService;
    private final TeachingRegistrationRepository teachingRegistrationRepository;
    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final ClassroomRepository classroomRepository;
    private final CoursePreferenceRepository coursePreferenceRepository;
    private final TimePreferenceRepository timePreferenceRepository;
    private final ScheduleRepository scheduleRepository;
    private final EntityManager entityManager;
    private final ScheduleMapper scheduleMapper;

    @Transactional
    public List<Schedule> generateSchedule(Semester semester) {
        List<TeachingRegistration> registrations = teachingRegistrationRepository
                .findByStatusAndSemester(RegistrationStatus.APPROVED, semester);

        if (registrations.isEmpty()) {
            throw new RuntimeException("No approved teaching registrations found for semester: " + semester);
        }

        Map<String, Object> requestData = buildRequestData(registrations, semester);
        JsonNode response = researchService.callSchedulingService(requestData);
        return parseAndSaveSchedules(response, semester);
    }

    @Transactional
    public ScheduleGenerationResponseDTO generateScheduleWithValue(Semester semester) {
        // Validate before generating
        List<String> validationErrors = validateScheduleGeneration(semester);
        if (!validationErrors.isEmpty()) {
            String errorMessage = "Không thể tạo lịch tự động. " + String.join(" ", validationErrors);
            throw new RuntimeException(errorMessage);
        }

        List<TeachingRegistration> registrations = teachingRegistrationRepository
                .findByStatusAndSemester(RegistrationStatus.APPROVED, semester);

        Map<String, Object> requestData = buildRequestData(registrations, semester);
        JsonNode response = researchService.callSchedulingService(requestData);
        return parseAndSaveSchedulesWithValue(response, semester);
    }

    private List<String> validateScheduleGeneration(Semester semester) {
        List<String> errors = new ArrayList<>();

        // Check approved teaching registrations
        List<TeachingRegistration> registrations = teachingRegistrationRepository
                .findByStatusAndSemester(RegistrationStatus.APPROVED, semester);
        if (registrations.isEmpty()) {
            errors.add("Chưa có đăng ký dạy học nào được phê duyệt cho học kỳ này.");
            return errors; // Return early if no registrations
        }

        Set<String> registrationIds = registrations.stream()
                .map(TeachingRegistration::getId)
                .collect(Collectors.toSet());

        // Check that all teachers with approved registrations have course preferences
        Set<String> teachersWithRegistrations = registrations.stream()
                .map(tr -> tr.getTeacher().getId())
                .collect(Collectors.toSet());

        // Check course preferences
        List<CoursePreference> coursePreferences = coursePreferenceRepository.findAll().stream()
                .filter(cp -> registrationIds.contains(cp.getTeachingRegistration().getId()))
                .filter(cp -> cp.getCourse() != null)
                .collect(Collectors.toList());
        
        if (coursePreferences.isEmpty()) {
            errors.add("Chưa có sở thích môn học nào được thiết lập cho các đăng ký đã phê duyệt.");
        } else {
            // Check if all teachers with registrations have at least one course preference
            Set<String> teachersWithCoursePreferences = coursePreferences.stream()
                    .map(cp -> cp.getTeachingRegistration().getTeacher().getId())
                    .collect(Collectors.toSet());
            
            Set<String> teachersWithoutCoursePreferences = new HashSet<>(teachersWithRegistrations);
            teachersWithoutCoursePreferences.removeAll(teachersWithCoursePreferences);
            
            if (!teachersWithoutCoursePreferences.isEmpty()) {
                errors.add("Có giảng viên chưa có đăng ký dạy học với sở thích môn học: " + 
                        String.join(", ", teachersWithoutCoursePreferences));
            }
        }

        // Check time preferences
        List<TimePreference> timePreferences = timePreferenceRepository.findAll().stream()
                .filter(tp -> registrationIds.contains(tp.getTeachingRegistration().getId()))
                .collect(Collectors.toList());
        
        if (timePreferences.isEmpty()) {
            errors.add("Chưa có sở thích thời gian nào được thiết lập cho các đăng ký đã phê duyệt.");
        } else {
            // Check if all teachers with registrations have at least one time preference
            Set<String> teachersWithTimePreferences = timePreferences.stream()
                    .map(tp -> tp.getTeachingRegistration().getTeacher().getId())
                    .collect(Collectors.toSet());
            
            Set<String> teachersWithoutTimePreferences = new HashSet<>(teachersWithRegistrations);
            teachersWithoutTimePreferences.removeAll(teachersWithTimePreferences);
            
            if (!teachersWithoutTimePreferences.isEmpty()) {
                errors.add("Có giảng viên chưa có đăng ký dạy học với sở thích thời gian: " + 
                        String.join(", ", teachersWithoutTimePreferences));
            }
        }

        // Check classrooms
        List<Classroom> classrooms = classroomRepository.findBySemester(semester, Pageable.unpaged())
                .getContent();
        if (classrooms.isEmpty()) {
            errors.add("Chưa có lớp học nào cho học kỳ này.");
        }

        // Check sections - ensure all sections have at least one teacher who can teach them
        Set<String> courseIds = coursePreferences.stream()
                .map(cp -> cp.getCourse().getId())
                .collect(Collectors.toSet());
        
        List<Section> sections = sectionRepository.findAll().stream()
                .filter(s -> s.getCourse() != null && courseIds.contains(s.getCourse().getId()))
                .collect(Collectors.toList());
        
        if (sections.isEmpty()) {
            errors.add("Chưa có học phần nào cho các môn học đã đăng ký.");
        } else {
            // Check if all sections have at least one eligible teacher
            Map<String, Set<String>> courseToTeachers = coursePreferences.stream()
                    .collect(Collectors.groupingBy(
                            cp -> cp.getCourse().getId(),
                            Collectors.mapping(
                                    cp -> cp.getTeachingRegistration().getTeacher().getId(),
                                    Collectors.toSet()
                            )
                    ));
            
            List<String> sectionsWithoutTeachers = new ArrayList<>();
            for (Section section : sections) {
                String courseId = section.getCourse().getId();
                Set<String> eligibleTeachers = courseToTeachers.get(courseId);
                if (eligibleTeachers == null || eligibleTeachers.isEmpty()) {
                    sectionsWithoutTeachers.add(section.getId() + " (" + section.getName() + ")");
                }
            }
            
            if (!sectionsWithoutTeachers.isEmpty()) {
                errors.add("Có học phần chưa có giảng viên nào đăng ký dạy: " + 
                        String.join(", ", sectionsWithoutTeachers));
            }
        }

        return errors;
    }

    private Map<String, Object> buildRequestData(List<TeachingRegistration> registrations, Semester semester) {
        Map<String, Object> requestData = new HashMap<>();
        requestData.put("teachers", buildTeachersData(registrations));
        requestData.put("courses", buildCoursesData(registrations));
        requestData.put("classrooms", buildClassroomsData(semester));
        return requestData;
    }

    private List<Map<String, Object>> buildTeachersData(List<TeachingRegistration> registrations) {
        Set<String> teacherIds = registrations.stream()
                .map(tr -> tr.getTeacher().getId())
                .collect(Collectors.toSet());

        return teacherIds.stream()
                .map(teacherId -> buildTeacherData(teacherId, registrations))
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildTeacherData(String teacherId, List<TeachingRegistration> registrations) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found: " + teacherId));

        TeachingRegistration reg = registrations.stream()
                .filter(r -> r.getTeacher().getId().equals(teacherId))
                .findFirst()
                .orElseThrow();

        Map<String, Object> teacherData = new HashMap<>();
        teacherData.put("id", teacher.getId());
        teacherData.put("name", teacher.getName());
        teacherData.put("max_courses", orDefault(reg.getMaxCourses(), DEFAULT_MAX_COURSES));
        teacherData.put("course_preferences", buildCoursePreferences(reg.getId()));
        teacherData.put("eligible_courses", buildEligibleCourses(reg.getId()));
        teacherData.put("day_time_preferences", buildDayTimePreferences(reg.getId()));
        return teacherData;
    }

    private Map<String, Integer> buildCoursePreferences(String registrationId) {
        return coursePreferenceRepository.findAll().stream()
                .filter(cp -> cp.getTeachingRegistration().getId().equals(registrationId))
                .filter(cp -> cp.getCourse() != null)
                .collect(Collectors.toMap(
                        cp -> cp.getCourse().getId(),
                        cp -> orDefault(cp.getPreferenceValue(), DEFAULT_PREFERENCE_VALUE)
                ));
    }

    private List<String> buildEligibleCourses(String registrationId) {
        return coursePreferenceRepository.findAll().stream()
                .filter(cp -> cp.getTeachingRegistration().getId().equals(registrationId))
                .filter(cp -> cp.getCourse() != null)
                .map(cp -> cp.getCourse().getId())
                .distinct()
                .collect(Collectors.toList());
    }

    private Map<String, Map<String, Integer>> buildDayTimePreferences(String registrationId) {
        Map<String, Map<String, Integer>> dayTimePreferences = new HashMap<>();
        timePreferenceRepository.findAll().stream()
                .filter(tp -> tp.getTeachingRegistration().getId().equals(registrationId))
                .forEach(tp -> {
                    String day = mapDayOfWeek(tp.getDay());
                    String period = mapPeriod(tp.getPeriod());
                    dayTimePreferences.computeIfAbsent(day, k -> new HashMap<>())
                            .put(period, orDefault(tp.getPreferenceValue(), DEFAULT_PREFERENCE_VALUE));
                });
        return dayTimePreferences;
    }

    private List<Map<String, Object>> buildCoursesData(List<TeachingRegistration> registrations) {
        Set<String> registrationIds = registrations.stream()
                .map(TeachingRegistration::getId)
                .collect(Collectors.toSet());

        Set<String> courseIds = coursePreferenceRepository.findAll().stream()
                .filter(cp -> cp.getCourse() != null)
                .filter(cp -> registrationIds.contains(cp.getTeachingRegistration().getId()))
                .map(cp -> cp.getCourse().getId())
                .collect(Collectors.toSet());

        return courseIds.stream()
                .map(this::buildCourseData)
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildCourseData(String courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        Map<String, Object> courseData = new HashMap<>();
        courseData.put("id", course.getId());
        courseData.put("name", course.getName());
        courseData.put("min_teachers", orDefault(course.getMinTeachers(), DEFAULT_MIN_TEACHERS));
        // If max_teachers is null, use max of min_teachers and DEFAULT_MAX_TEACHERS to ensure max >= min
        Integer maxTeachers = course.getMaxTeachers();
        if (maxTeachers == null) {
            Integer minTeachers = course.getMinTeachers();
            maxTeachers = Math.max(orDefault(minTeachers, DEFAULT_MIN_TEACHERS), DEFAULT_MAX_TEACHERS);
        }
        courseData.put("max_teachers", maxTeachers);
        courseData.put("sections", buildSectionsData(courseId));
        return courseData;
    }

    private List<Map<String, Object>> buildSectionsData(String courseId) {
        return sectionRepository.findAll().stream()
                .filter(s -> s.getCourse().getId().equals(courseId))
                .map(s -> {
                    Map<String, Object> sectionData = new HashMap<>();
                    sectionData.put("id", s.getId());
                    sectionData.put("required_periods", orDefault(s.getPeriodRequired(), DEFAULT_REQUIRED_PERIODS));
                    sectionData.put("required_seats", orDefault(s.getRequiredSeats(), DEFAULT_REQUIRED_SEATS));
                    return sectionData;
                })
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildClassroomsData(Semester semester) {
        List<Classroom> classrooms = classroomRepository.findBySemester(semester, Pageable.unpaged())
                .getContent();

        Map<String, Object> classroomsData = new HashMap<>();
        classroomsData.put("days", WEEKDAYS);
        classroomsData.put("periods", generatePeriodsArray());
        classroomsData.put("classrooms", classrooms.stream()
                .map(c -> {
                    Map<String, Object> classroomData = new HashMap<>();
                    classroomData.put("id", c.getId());
                    classroomData.put("capacity", orDefault(c.getCapacity(), DEFAULT_CAPACITY));
                    return classroomData;
                })
                .collect(Collectors.toList()));
        return classroomsData;
    }

    private List<String> generatePeriodsArray() {
        return IntStream.range(0, Period.values().length)
                .mapToObj(i -> String.valueOf(i + 1))
                .collect(Collectors.toList());
    }

    private List<Schedule> parseAndSaveSchedules(JsonNode response, Semester semester) {
        validateResponse(response);

        JsonNode assignments = response.get("solution").get("assignments");
        List<Schedule> schedules = new ArrayList<>();

        for (JsonNode assignment : assignments) {
            if (!hasRequiredFields(assignment)) {
                log.warn("Skipping assignment with missing fields: {}", assignment.toString());
                continue;
            }

            Schedule schedule = buildScheduleFromAssignment(assignment, semester);
            schedules.add(schedule);
        }

        deleteExistingSchedules(semester);
        return scheduleRepository.saveAll(schedules);
    }

    private ScheduleGenerationResponseDTO parseAndSaveSchedulesWithValue(JsonNode response, Semester semester) {
        validateResponse(response);

        JsonNode solution = response.get("solution");
        Integer objectiveValue = null;
        if (solution.has("objective_value") && !solution.get("objective_value").isNull()) {
            objectiveValue = solution.get("objective_value").asInt();
        }

        JsonNode assignments = solution.get("assignments");
        List<Schedule> schedules = new ArrayList<>();

        // First, delete existing schedules for this semester
        deleteExistingSchedules(semester);

        // Build schedules and delete any conflicting schedules (from other semesters)
        Set<String> processedKeys = new HashSet<>();
        for (JsonNode assignment : assignments) {
            if (!hasRequiredFields(assignment)) {
                log.warn("Skipping assignment with missing fields: {}", assignment.toString());
                continue;
            }

            String classroomId = assignment.get("classroom_id").asText();
            DayOfWeek day = parseDayOfWeek(assignment.get("day").asText());
            Period period = parsePeriod(assignment.get("period").asText());
            
            // Create a unique key to avoid deleting the same conflict multiple times
            String conflictKey = classroomId + "_" + day + "_" + period;
            if (!processedKeys.contains(conflictKey)) {
                // Delete any conflicting schedules (from any semester) for this room/day/period
                scheduleRepository.deleteByClassroomAndDayAndPeriod(classroomId, day, period);
                processedKeys.add(conflictKey);
            }
            
            Schedule schedule = buildScheduleFromAssignment(assignment, semester);
            schedules.add(schedule);
        }
        
        // Flush to ensure all deletes are committed before insert
        entityManager.flush();
        entityManager.clear();

        List<Schedule> savedSchedules = scheduleRepository.saveAll(schedules);

        List<ScheduleDTO> scheduleDTOs = savedSchedules.stream()
                .map(scheduleMapper::toDto)
                .collect(Collectors.toList());

        return ScheduleGenerationResponseDTO.builder()
                .schedules(scheduleDTOs)
                .objectiveValue(objectiveValue)
                .build();
    }

    private void validateResponse(JsonNode response) {
        if (!response.has("status") || !"success".equals(response.get("status").asText())) {
            throw new RuntimeException("Research service returned error: " + response.toString());
        }

        JsonNode solution = response.get("solution");
        if (solution == null || !solution.has("assignments")) {
            throw new RuntimeException("No assignments in response");
        }
    }

    private boolean hasRequiredFields(JsonNode assignment) {
        return assignment.has("teacher_id") && assignment.has("section_id") &&
                assignment.has("day") && assignment.has("period") && assignment.has("classroom_id");
    }

    private Schedule buildScheduleFromAssignment(JsonNode assignment, Semester semester) {
        String teacherId = assignment.get("teacher_id").asText();
        String sectionId = assignment.get("section_id").asText();
        String classroomId = assignment.get("classroom_id").asText();
        DayOfWeek day = parseDayOfWeek(assignment.get("day").asText());
        Period period = parsePeriod(assignment.get("period").asText());

        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found: " + teacherId));
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Section not found: " + sectionId));
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found: " + classroomId));

        String scheduleId = String.format("%s_%s_%s_%s_%s", teacherId, sectionId, day, period, classroomId);

        return Schedule.builder()
                .id(scheduleId)
                .semester(semester)
                .teacher(teacher)
                .section(section)
                .classroom(classroom)
                .day(day)
                .period(period)
                .build();
    }

    private void deleteExistingSchedules(Semester semester) {
        scheduleRepository.deleteBySemester(semester);
        // Flush to ensure delete is committed before insert
        entityManager.flush();
        entityManager.clear();
    }

    private String mapDayOfWeek(DayOfWeek day) {
        switch (day) {
            case MONDAY: return "Mon";
            case TUESDAY: return "Tue";
            case WEDNESDAY: return "Wed";
            case THURSDAY: return "Thu";
            case FRIDAY: return "Fri";
            case SATURDAY: return "Sat";
            case SUNDAY: return "Sun";
            default: return day.toString().substring(0, 3);
        }
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

    private String mapPeriod(Period period) {
        return String.valueOf(period.ordinal() + 1);
    }

    private Period parsePeriod(String periodStr) {
        int periodNum = Integer.parseInt(periodStr);
        if (periodNum < 1 || periodNum > Period.values().length) {
            throw new RuntimeException("Invalid period number: " + periodStr +
                    ". Expected range: 1-" + Period.values().length);
        }
        return Period.values()[periodNum - 1];
    }

    private <T> T orDefault(T value, T defaultValue) {
        return value != null ? value : defaultValue;
    }
}

