package com.university.schedule.utils;

import com.university.schedule.enums.Semester;

/**
 * Utility class for Semester-related operations.
 */
public final class SemesterUtils {

    private SemesterUtils() {
        // Utility class - prevent instantiation
    }

    /**
     * Parses a semester string to Semester enum.
     * 
     * @param semesterStr the semester string to parse
     * @return the parsed Semester enum
     * @throws IllegalArgumentException if the semester string is null, blank, or invalid
     */
    public static Semester parseSemester(String semesterStr) {
        if (semesterStr == null || semesterStr.isBlank()) {
            throw new IllegalArgumentException("Semester is required");
        }
        try {
            return Semester.valueOf(semesterStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid semester value: " + semesterStr, e);
        }
    }
}

