package com.university.schedule.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.university.schedule.dtos.AssignmentDTO;
import com.university.schedule.dtos.ScheduleDTO;
import com.university.schedule.dtos.ScheduleGenerationResponseDTO;
import com.university.schedule.dtos.StatisticsDTO;
import com.university.schedule.entities.*;
import com.university.schedule.enums.RegistrationStatus;
import com.university.schedule.enums.RegistrationStatus;
import com.university.schedule.mappers.ScheduleJsonMapper;
import com.university.schedule.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.*;
import java.util.stream.Collectors;

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
    private final ClassroomRepository classroomRepository;
    private final CoursePreferenceRepository coursePreferenceRepository;
    private final TimePreferenceRepository timePreferenceRepository;
    private final ScheduleRepository scheduleRepository;
    private final ScheduleJsonMapper scheduleJsonMapper;
    private final PeriodRepository periodRepository;
    private final SectionRepository sectionRepository;

    @Transactional
    public List<Schedule> generateSchedule(String semester) {
        // This method is deprecated - use generateScheduleWithValue instead
        throw new UnsupportedOperationException("This method is deprecated. Use generateScheduleWithValue instead.");
    }

    @Transactional
    public ScheduleGenerationResponseDTO generateScheduleWithValue(String semester, String algorithm, String scheduleName) {
        // Validate before generating
        List<String> validationErrors = validateScheduleGeneration(semester);
        if (!validationErrors.isEmpty()) {
            String errorMessage = "Không thể tạo lịch tự động. " + String.join(" ", validationErrors);
            throw new RuntimeException(errorMessage);
        }

        List<TeachingRegistration> registrations = teachingRegistrationRepository
                .findByStatusAndSemester(RegistrationStatus.APPROVED, semester);

        // Check limits for exact scheduling
        if ("exact".equalsIgnoreCase(algorithm)) {
            // Count teachers
            long distinctTeachers = registrations.stream()
                .map(tr -> tr.getTeacher().getId())
                .distinct()
                .count();
            
            // Count sections for courses in these registrations
            Set<String> registrationIds = registrations.stream()
                .map(TeachingRegistration::getId)
                .collect(Collectors.toSet());

            Set<String> courseIds = coursePreferenceRepository.findAll().stream()
                .filter(cp -> cp.getTeachingRegistration() != null && registrationIds.contains(cp.getTeachingRegistration().getId()))
                .filter(cp -> cp.getCourse() != null)
                .map(cp -> cp.getCourse().getId())
                .distinct()
                .collect(Collectors.toSet());

            long totalSections = sectionRepository.findAll().stream()
                .filter(s -> s.getCourse() != null && courseIds.contains(s.getCourse().getId()))
                .count();

            if (distinctTeachers > 15 || totalSections > 30) {
                 throw new RuntimeException("dataset too large for exact scheduling. Limit: 15 Teachers, 30 Sections. Current: " + distinctTeachers + " Teachers, " + totalSections + " Sections.");
            }
        }

        Map<String, Object> requestData = buildRequestData(registrations, semester);
        requestData.put("algorithm", algorithm);
        JsonNode response = researchService.callSchedulingService(requestData);
        return parseAndSaveSchedulesWithValue(response, semester, scheduleName);
    }

    private List<String> validateScheduleGeneration(String semester) {
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

    private Map<String, Object> buildRequestData(List<TeachingRegistration> registrations, String semester) {
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

    private Map<String, Object> buildClassroomsData(String semester) {
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
        return periodRepository.findAllByOrderByOrderIndexAsc().stream()
                .map(p -> String.valueOf(p.getOrderIndex()))
                .collect(Collectors.toList());
    }


    private ScheduleGenerationResponseDTO parseAndSaveSchedulesWithValue(JsonNode response, String semester, String scheduleName) {
        validateResponse(response);

        JsonNode solution = response.get("solution");
        Integer objectiveValue = null;
        if (solution.has("objective_value") && !solution.get("objective_value").isNull()) {
            objectiveValue = solution.get("objective_value").asInt();
        }

        JsonNode assignmentsNode = solution.get("assignments");

        // Delete existing schedule with the same name
        if (scheduleName != null && !scheduleName.isEmpty()) {
            scheduleRepository.deleteBySemesterAndName(semester, scheduleName);
        } else {
            throw new IllegalArgumentException("Schedule name is required for generation. Cannot proceed to avoid accidental data loss.");
        }

        // Convert assignments to DTOs
        List<AssignmentDTO> assignments = new ArrayList<>();
        Set<String> teacherIds = new HashSet<>();
        Set<String> classroomIds = new HashSet<>();
        Set<String> courseIds = new HashSet<>();
        Set<String> sectionIds = new HashSet<>();
        
        for (JsonNode assignmentNode : assignmentsNode) {
            if (!hasRequiredFields(assignmentNode)) {
                log.warn("Skipping assignment with missing fields: {}", assignmentNode.toString());
                continue;
            }

            AssignmentDTO assignment = AssignmentDTO.builder()
                    .teacherId(assignmentNode.get("teacher_id").asText())
                    .sectionId(assignmentNode.get("section_id").asText())
                    .classroomId(assignmentNode.get("classroom_id").asText())
                    .day(assignmentNode.get("day").asText())
                    .period(assignmentNode.get("period").asText())
                    .build();
            
            // Extract course_id if available
            if (assignmentNode.has("course_id")) {
                assignment.setCourseId(assignmentNode.get("course_id").asText());
            } else {
                // Try to get course_id from section
                try {
                    Section section = sectionRepository.findById(assignment.getSectionId()).orElse(null);
                    if (section != null && section.getCourse() != null) {
                        assignment.setCourseId(section.getCourse().getId());
                    }
                } catch (Exception e) {
                    log.warn("Could not get course_id for section {}", assignment.getSectionId());
                }
            }
            
            assignments.add(assignment);
            teacherIds.add(assignment.getTeacherId());
            classroomIds.add(assignment.getClassroomId());
            if (assignment.getCourseId() != null) {
                courseIds.add(assignment.getCourseId());
            }
            sectionIds.add(assignment.getSectionId());
        }

        // Build statistics
        StatisticsDTO statistics = StatisticsDTO.builder()
                .numAssignments(assignments.size())
                .numClassrooms(classroomIds.size())
                .numCourses(courseIds.size())
                .numSections(sectionIds.size())
                .numTeachers(teacherIds.size())
                .build();

        // Create single Schedule record with JSON
        String scheduleId = scheduleName + "_" + semester;
        ScheduleDTO scheduleDTO = ScheduleDTO.builder()
                .id(scheduleId)
                .semester(semester)
                .name(scheduleName)
                .assignments(assignments)
                .statistics(statistics)
                .objectiveValue(objectiveValue)
                .build();

        Schedule schedule = scheduleJsonMapper.toEntity(scheduleDTO);
        schedule.setSemester(semester);
        
        Schedule savedSchedule = scheduleRepository.save(schedule);

        ScheduleDTO savedDTO = scheduleJsonMapper.toDto(savedSchedule);

        return ScheduleGenerationResponseDTO.builder()
                .schedules(List.of(savedDTO))
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

    private String mapPeriod(Period period) {
        return String.valueOf(period.getOrderIndex());
    }

    private <T> T orDefault(T value, T defaultValue) {
        return value != null ? value : defaultValue;
    }
}

