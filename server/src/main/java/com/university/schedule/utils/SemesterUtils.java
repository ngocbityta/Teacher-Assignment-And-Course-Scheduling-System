package com.university.schedule.utils;

import com.university.schedule.enums.Semester;

public final class SemesterUtils {

    private SemesterUtils() {
    }

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

