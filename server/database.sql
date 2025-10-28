-- 1. Tạo enum period
DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'period_enum') THEN
CREATE TYPE period_enum AS ENUM ('P1','P2','P3','P4','P5','P6','P7','P8');
END IF;
END$$;

-- 2. Tạo bảng
CREATE TABLE IF NOT EXISTS Classroom
(
    id
    VARCHAR
    PRIMARY
    KEY,
    name
    VARCHAR
    NOT
    NULL,
    capacity
    INT
    NOT
    NULL
);

CREATE TABLE IF NOT EXISTS Course
(
    id
    VARCHAR
    PRIMARY
    KEY,
    name
    VARCHAR
    NOT
    NULL,
    min_teachers
    INT
    NOT
    NULL,
    max_teachers
    INT
    NOT
    NULL
);

CREATE TABLE IF NOT EXISTS Section
(
    id
    VARCHAR
    PRIMARY
    KEY,
    course_id
    VARCHAR
    NOT
    NULL
    REFERENCES
    Course
(
    id
) ON DELETE CASCADE,
    name VARCHAR NOT NULL
    );

CREATE TABLE IF NOT EXISTS Teacher
(
    id
    VARCHAR
    PRIMARY
    KEY,
    name
    VARCHAR
    NOT
    NULL
);

CREATE TABLE IF NOT EXISTS Semester
(
    id
    VARCHAR
    PRIMARY
    KEY,
    name
    VARCHAR
    NOT
    NULL,
    start_date
    DATE
    NOT
    NULL,
    end_date
    DATE
    NOT
    NULL
);

CREATE TABLE IF NOT EXISTS CoursePreference
(
    id
    VARCHAR
    PRIMARY
    KEY,
    semester_id
    VARCHAR
    NOT
    NULL
    REFERENCES
    Semester
(
    id
) ON DELETE CASCADE,
    teacher_id VARCHAR NOT NULL REFERENCES Teacher
(
    id
)
  ON DELETE CASCADE,
    course_id VARCHAR NOT NULL REFERENCES Course
(
    id
)
  ON DELETE CASCADE,
    preference_value INT NOT NULL
    );

CREATE TABLE IF NOT EXISTS TimePreference
(
    id
    VARCHAR
    PRIMARY
    KEY,
    teacher_id
    VARCHAR
    NOT
    NULL
    REFERENCES
    Teacher
(
    id
) ON DELETE CASCADE,
    semester_id VARCHAR NOT NULL REFERENCES Semester
(
    id
)
  ON DELETE CASCADE,
    period period_enum NOT NULL,
    day INT NOT NULL CHECK
(
    day
    >=
    1
    AND
    day
    <=
    7
),
    preference_value INT NOT NULL
    );

CREATE TABLE IF NOT EXISTS TeacherRegistration
(
    id
    VARCHAR
    PRIMARY
    KEY,
    teacher_id
    VARCHAR
    NOT
    NULL
    REFERENCES
    Teacher
(
    id
) ON DELETE CASCADE,
    semester_id VARCHAR NOT NULL REFERENCES Semester
(
    id
)
  ON DELETE CASCADE,
    max_courses INT NOT NULL
    );

CREATE TABLE IF NOT EXISTS Schedule
(
    id
    VARCHAR
    PRIMARY
    KEY,
    semester_id
    VARCHAR
    NOT
    NULL
    REFERENCES
    Semester
(
    id
) ON DELETE CASCADE,
    teacher_id VARCHAR NOT NULL REFERENCES Teacher
(
    id
)
  ON DELETE CASCADE,
    section_id VARCHAR NOT NULL REFERENCES Section
(
    id
)
  ON DELETE CASCADE,
    classroom_id VARCHAR NOT NULL REFERENCES Classroom
(
    id
)
  ON DELETE CASCADE,
    day INT NOT NULL CHECK
(
    day
    >=
    1
    AND
    day
    <=
    7
),
    period period_enum NOT NULL
    );

-- 3. Indexes tối ưu
CREATE INDEX IF NOT EXISTS idx_schedule_teacher_semester ON Schedule(teacher_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_course_preference_teacher_semester ON CoursePreference(teacher_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_time_preference_teacher_semester ON TimePreference(teacher_id, semester_id);
