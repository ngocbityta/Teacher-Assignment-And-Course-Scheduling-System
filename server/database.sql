CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- semesters
CREATE TABLE IF NOT EXISTS semesters (
    id varchar(100) PRIMARY KEY,
    name varchar NOT NULL,
    start_date date,
    end_date date
);

-- teachers
CREATE TABLE IF NOT EXISTS teachers (
    id varchar(100) PRIMARY KEY,
    name varchar NOT NULL,
    status varchar(50)
);

-- classrooms
CREATE TABLE IF NOT EXISTS classrooms (
    id varchar(100) PRIMARY KEY,
    name varchar NOT NULL,
    capacity integer,
    status varchar(50)
);

-- courses
CREATE TABLE IF NOT EXISTS courses (
    id varchar(100) PRIMARY KEY,
    name varchar NOT NULL,
    min_teachers integer,
    max_teachers integer
);

-- sections (many-to-one -> course)
CREATE TABLE IF NOT EXISTS sections (
    id varchar(100) PRIMARY KEY,
    name varchar,
    period_required integer,
    course_id varchar(100) NOT NULL REFERENCES courses (id) ON DELETE CASCADE
);

-- teaching_registrations
CREATE TABLE IF NOT EXISTS teaching_registrations (
    id varchar(100) PRIMARY KEY,
    teacher_id varchar(100) NOT NULL REFERENCES teachers (id) ON DELETE CASCADE,
    semester_id varchar(100) NOT NULL REFERENCES semesters (id) ON DELETE CASCADE,
    status varchar(30) NOT NULL,
    max_courses integer,
    CONSTRAINT uq_teachreg_teacher_semester UNIQUE (teacher_id, semester_id)
);

-- course_preferences (some ids are generated UUIDs in backend)
CREATE TABLE IF NOT EXISTS course_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    semester_id varchar(100) REFERENCES semesters (id) ON DELETE CASCADE,
    teacher_id varchar(100) REFERENCES teachers (id) ON DELETE CASCADE,
    teaching_registration_id varchar(100) NOT NULL REFERENCES teaching_registrations (id) ON DELETE CASCADE,
    course_id varchar(100) REFERENCES courses (id) ON DELETE CASCADE,
    preference_value integer,
    CONSTRAINT uq_coursepref_teacher_course UNIQUE (teacher_id, course_id)
);

-- time_preferences
-- day stored as text (DayOfWeek.name()), period stored as text (Period.name())
CREATE TABLE IF NOT EXISTS time_preferences (
    id varchar(100) PRIMARY KEY,
    teacher_id varchar(100) NOT NULL REFERENCES teachers (id) ON DELETE CASCADE,
    semester_id varchar(100) NOT NULL REFERENCES semesters (id) ON DELETE CASCADE,
    teaching_registration_id varchar(100) NOT NULL REFERENCES teaching_registrations (id) ON DELETE CASCADE,
    day varchar(16) NOT NULL,
    period varchar(16) NOT NULL,
    preference_value integer,
    CONSTRAINT uq_timepref_teacher_semester_day_period UNIQUE (
        teacher_id,
        semester_id,
        day,
        period
    )
);

-- schedules
CREATE TABLE IF NOT EXISTS schedules (
    id varchar(100) PRIMARY KEY,
    semester_id varchar(100) NOT NULL REFERENCES semesters (id) ON DELETE CASCADE,
    teacher_id varchar(100) NOT NULL REFERENCES teachers (id) ON DELETE CASCADE,
    section_id varchar(100) NOT NULL REFERENCES sections (id) ON DELETE CASCADE,
    room_id varchar(100) NOT NULL REFERENCES classrooms (id) ON DELETE CASCADE,
    day varchar(16) NOT NULL,
    period varchar(16) NOT NULL,
    CONSTRAINT uq_schedule_section_day_period UNIQUE (section_id, day, period),
    CONSTRAINT uq_schedule_room_day_period UNIQUE (room_id, day, period)
);

-- registration status constraint
ALTER TABLE IF EXISTS teaching_registrations
ADD CONSTRAINT chk_registration_status CHECK (
    status IN (
        'PENDING',
        'APPROVED',
        'REJECTED'
    )
);

-- optionally constrain period values to the 5 backend periods (CA1..CA5)
ALTER TABLE IF EXISTS time_preferences
ADD CONSTRAINT chk_timepref_period CHECK (
    period IN (
        'CA1',
        'CA2',
        'CA3',
        'CA4',
        'CA5'
    )
);

ALTER TABLE IF EXISTS schedules
ADD CONSTRAINT chk_schedule_period CHECK (
    period IN (
        'CA1',
        'CA2',
        'CA3',
        'CA4',
        'CA5'
    )
);

-- index hints
CREATE INDEX IF NOT EXISTS idx_schedules_teacher_semester ON schedules (teacher_id, semester_id);

CREATE INDEX IF NOT EXISTS idx_course_preferences_teacher_semester ON course_preferences (teacher_id, semester_id);

CREATE INDEX IF NOT EXISTS idx_time_preferences_teacher_semester ON time_preferences (teacher_id, semester_id);