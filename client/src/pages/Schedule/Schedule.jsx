import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import styles from "./Schedule.module.css";
import scheduleAPI from "../../api/schedule";
import { getSelectedSemester } from "../../api";
import { teachersAPI } from "../../api/teachers";
import { PERIODS } from "../../api/timeSlots";
import { sectionAPI } from "../../api/section";
import { classroomAPI } from "../../api/classroom";
import { coursePreferenceAPI } from "../../api/coursePreference";

const Tabs = { VIEW: "view", EDIT: "edit" };

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [coursePreferences, setCoursePreferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatingExact, setGeneratingExact] = useState(false);
  const [activeTab, setActiveTab] = useState(Tabs.VIEW);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedScheduleName, setSelectedScheduleName] = useState(null); // null means show all
  const [scheduleSets, setScheduleSets] = useState([]); // list of schedule set names from backend

  const [currentScheduleValue, setCurrentScheduleValue] = useState(null);
  const [evaluatingValue, setEvaluatingValue] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formSectionId, setFormSectionId] = useState("");
  const [formTimeKey, setFormTimeKey] = useState("");
  const [formClassroomId, setFormClassroomId] = useState("");

  const [confirmModal, setConfirmModal] = useState(null);
  const [promptModal, setPromptModal] = useState(null);

  // Load schedules from database
  const loadSchedules = async (scheduleName = selectedScheduleName) => {
    try {
      setLoading(true);
      setError(null);
      const semester = getSelectedSemester();
      const params = { semester };
      if (scheduleName) {
        params.name = scheduleName;
      }
      const data = await scheduleAPI.list(params);

      // Backend now returns ScheduleDTO with assignments array (JSON format)
      // Convert to flat list of schedule items for frontend display
      const flatSchedules = [];

      if (Array.isArray(data)) {
        for (const scheduleDTO of data) {
          // If schedule has assignments array (new format), convert to flat list
          if (scheduleDTO.assignments && Array.isArray(scheduleDTO.assignments)) {
            for (const assignment of scheduleDTO.assignments) {
              // Convert day from "Mon", "Tue" to "MONDAY", "TUESDAY"
              const dayMap = {
                "Mon": "MONDAY",
                "Tue": "TUESDAY",
                "Wed": "WEDNESDAY",
                "Thu": "THURSDAY",
                "Fri": "FRIDAY",
                "Sat": "SATURDAY",
                "Sun": "SUNDAY"
              };
              const day = dayMap[assignment.day] || assignment.day.toUpperCase();

              // Convert period order index to period ID
              // Convert period order index to period ID
              // Period order: 1 -> period-ca1, 2 -> period-ca2, etc.
              const startPeriodOrder = parseInt(assignment.period);

              // Find section to get duration
              const section = sections.find(s => s.id === assignment.sectionId);
              const duration = section ? (section.periodRequired || 1) : 1;

              for (let i = 0; i < duration; i++) {
                const currentPeriodOrder = startPeriodOrder + i;
                // Check bounds
                if (currentPeriodOrder - 1 >= PERIODS.length) break;

                const periodId = PERIODS[currentPeriodOrder - 1]?.id || `period-ca${currentPeriodOrder}`;

                flatSchedules.push({
                  id: `${scheduleDTO.id}_${assignment.teacherId}_${assignment.sectionId}_${day}_${periodId}_${assignment.classroomId}`,
                  teacherId: assignment.teacherId,
                  sectionId: assignment.sectionId,
                  classroomId: assignment.classroomId,
                  day: day,
                  periodId: periodId,
                  period: periodId, // For backward compatibility
                  // Additional fields from scheduleDTO if available
                  semester: scheduleDTO.semester,
                  name: scheduleDTO.name,
                });
              }
            }
          } else {
            // Old format (if any) - keep as is
            flatSchedules.push(scheduleDTO);
          }
        }
      }

      setSchedules(flatSchedules);
    } catch (err) {
      const errorMsg = err.message || "Không thể tải lịch phân công";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Error loading schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load schedule sets from backend
  const loadScheduleSets = async () => {
    try {
      const semester = getSelectedSemester();
      if (!semester) return;
      const sets = await scheduleAPI.listSets(semester);
      setScheduleSets(Array.isArray(sets) ? sets : []);
    } catch (err) {
      console.error("Error loading schedule sets:", err);
      setScheduleSets([]);
    }
  };

  // Evaluate schedule value from database
  const evaluateScheduleValue = async (scheduleName = selectedScheduleName) => {
    try {
      setEvaluatingValue(true);
      const semester = getSelectedSemester();
      if (!semester) {
        setCurrentScheduleValue(null);
        return;
      }
      const value = await scheduleAPI.evaluate(semester, scheduleName);
      setCurrentScheduleValue(value);
    } catch (err) {
      console.error("Error evaluating schedule value:", err);
      setCurrentScheduleValue(null);
    } finally {
      setEvaluatingValue(false);
    }
  };

  // Reload schedules and re-evaluate after any change
  const refreshSchedulesAndEvaluate = async () => {
    await loadSchedules(selectedScheduleName);
    await evaluateScheduleValue(selectedScheduleName);
    await loadScheduleSets(); // Also refresh the list of schedule sets
  };

  const loadTeachers = async () => {
    try {
      const data = await teachersAPI.list();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading teachers:", err);
    }
  };

  const loadMeta = async () => {
    try {
      setMetaLoading(true);
      const [{ items: sectionItems }, classroomItems, prefItems] = await Promise.all([
        sectionAPI.list(),
        classroomAPI.list(),
        coursePreferenceAPI.list(),
      ]);
      setSections(sectionItems || []);
      setClassrooms(classroomItems || []);
      setCoursePreferences(prefItems || []);
    } catch (err) {
      console.error("Error loading sections/classrooms/prefs:", err);
    } finally {
      setMetaLoading(false);
    }
  };


  const handleGenerate = async (algorithm = 'heuristic') => {
    try {
      if (algorithm === 'exact') {
        setGeneratingExact(true);
      } else {
        setGenerating(true);
      }
      setError(null);
      const semester = getSelectedSemester();
      if (!semester) {
        setError("Vui lòng chọn học kỳ trước.");
        return;
      }

      // Phải chọn một schedule cụ thể để xếp lịch tự động
      if (!selectedScheduleName) {
        setError("Vui lòng chọn một lịch cụ thể hoặc tạo lịch mới trước khi xếp lịch tự động.");
        return;
      }

      // Check if schedule is not empty
      if (schedules.length > 0) {
        const confirmMsg = `Lịch "${selectedScheduleName}" đã có ${schedules.length} phân công. Vui lòng tạo bản lịch mới hoặc xóa các phân công hiện tại trước khi xếp lịch tự động.`;
        toast.warning(confirmMsg, { autoClose: 5000 });
        setError(confirmMsg);
        return;
      }

      // Pass the current schedule name to generate API
      await scheduleAPI.generate(semester, algorithm, selectedScheduleName);

      // Refresh schedule sets list first
      await loadScheduleSets();

      // Reload schedules from backend to ensure consistency
      await loadSchedules(selectedScheduleName);
      await evaluateScheduleValue(selectedScheduleName);

      toast.success(`Tạo lịch (${algorithm === 'exact' ? 'Chính xác' : 'Heuristic'}) thành công!`);
    } catch (err) {
      let errorMsg = err.message || "Không thể tạo lịch tự động";

      if (errorMsg.includes("dataset too large")) {
        errorMsg = "Dữ liệu quá lớn để chạy thuật toán chính xác (Giới hạn: 10 GV, 20 HP). Vui lòng dùng Heuristic.";
      }

      setError(errorMsg);
      toast.error(errorMsg, { autoClose: 5000 });
      console.error("Error generating schedule:", err);
    } finally {
      setGenerating(false);
      setGeneratingExact(false);
    }
  };

  const handleClearSchedules = async () => {
    // Chỉ cho phép xóa khi có schedule được chọn
    if (!selectedScheduleName) {
      toast.warning("Vui lòng chọn một lịch để xóa.");
      return;
    }

    const deleteMessage = `Xác nhận xóa lịch "${selectedScheduleName}"? Lịch này sẽ bị xóa vĩnh viễn và không thể khôi phục.`;

    setConfirmModal({
      message: deleteMessage,
      onConfirm: async () => {
        try {
          const semester = getSelectedSemester();
          if (!semester) {
            toast.warning("Vui lòng chọn học kỳ trước.");
            setConfirmModal(null);
            return;
          }

          // Chỉ xóa schedule với tên được chọn
          await scheduleAPI.removeSet(selectedScheduleName, semester);

          // Xóa schedule khỏi local state
          setScheduleSets(prev => prev.filter(name => name !== selectedScheduleName));

          // Chuyển sang schedule khác hoặc null
          const remainingSets = scheduleSets.filter(name => name !== selectedScheduleName);
          if (remainingSets.length > 0) {
            setSelectedScheduleName(remainingSets[0]);
          } else {
            setSelectedScheduleName(null);
            setSchedules([]);
            setCurrentScheduleValue(null);
          }

          await loadScheduleSets(); // Refresh the list from backend
          toast.success(`Đã xóa lịch "${selectedScheduleName}".`);
        } catch (err) {
          console.error(err);
          toast.error("Xóa thất bại: " + (err.message || ""));
        }
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  // Show prompt modal to ask for schedule name
  const handleCreateNewSchedule = () => {
    const defaultName = `Lịch ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    setPromptModal({
      title: "Tạo lịch mới",
      message: "Nhập tên cho lịch mới:",
      defaultValue: defaultName,
      onConfirm: async (name) => {
        setPromptModal(null);
        if (!name || !name.trim()) {
          toast.warning("Vui lòng nhập tên cho lịch.");
          return;
        }
        await doCreateNewSchedule(name.trim());
      },
      onCancel: () => setPromptModal(null),
    });
  };

  // Actually create the new schedule after getting the name
  const doCreateNewSchedule = async (scheduleName) => {
    try {
      const semester = getSelectedSemester();
      if (!semester) {
        toast.warning("Vui lòng chọn học kỳ trước.");
        return;
      }

      // Check if name already exists
      if (scheduleSets.includes(scheduleName)) {
        toast.warning(`Lịch "${scheduleName}" đã tồn tại. Vui lòng chọn tên khác.`);
        return;
      }

      // Create empty schedule in database
      const scheduleId = `${scheduleName}_${semester}`;
      const emptySchedule = {
        id: scheduleId,
        semester,
        name: scheduleName,
        assignments: [], // Empty array
        statistics: {
          numAssignments: 0,
          numClassrooms: 0,
          numCourses: 0,
          numSections: 0,
          numTeachers: 0
        }
      };

      await scheduleAPI.create(emptySchedule);

      // Switch to the new schedule set
      setSelectedScheduleName(scheduleName);
      setSchedules([]);
      setCurrentScheduleValue(null);

      // Refresh schedule sets list from backend
      await loadScheduleSets();

      toast.success(`Đã tạo lịch mới: "${scheduleName}". Hãy xếp lịch tự động hoặc thêm thủ công.`);
    } catch (err) {
      console.error(err);
      toast.error("Tạo lịch mới thất bại: " + (err.message || ""));
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadTeachers();
        await loadMeta();

        const semester = getSelectedSemester();
        if (semester) {
          const sets = await scheduleAPI.listSets(semester);
          const validSets = Array.isArray(sets) ? sets : [];
          setScheduleSets(validSets);

          if (validSets.length > 0 && !selectedScheduleName) {
            // Auto select the first set if none selected
            setSelectedScheduleName(validSets[0]);
          }
        }
      } catch (err) {
        console.error("Error initializing schedule page:", err);
      }
    };
    init();
  }, []);

  // Reload schedules when selected schedule name changes
  useEffect(() => {
    if (selectedScheduleName) {
      loadSchedules(selectedScheduleName);
      evaluateScheduleValue(selectedScheduleName);
    } else {
      // If no name selected, clear schedules to avoid confusion
      setSchedules([]);
      setCurrentScheduleValue(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScheduleName]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => (t.id || t._id) === selectedTeacherId) || null,
    [teachers, selectedTeacherId]
  );

  const teacherSchedules = useMemo(
    () =>
      selectedTeacherId
        ? schedules.filter((s) => s.teacherId === selectedTeacherId)
        : schedules,
    [schedules, selectedTeacherId]
  );

  const formatDay = (day) => {
    const days = {
      MONDAY: "Thứ 2",
      TUESDAY: "Thứ 3",
      WEDNESDAY: "Thứ 4",
      THURSDAY: "Thứ 5",
      FRIDAY: "Thứ 6",
      SATURDAY: "Thứ 7",
      SUNDAY: "Chủ nhật",
    };
    return days[day] || day;
  };

  const formatPeriodLabel = (periodId) => {
    const p = PERIODS.find((x) => x.id === periodId);
    return p ? p.name : periodId || "";
  };

  const dayKeys = useMemo(
    () => ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
    []
  );

  const periodIds = useMemo(() => PERIODS.map((p) => p.id), []);

  // Helper to extract period ID from schedule, handling both 'period' and 'periodId' fields
  const getPeriodId = React.useCallback((schedule) => {
    let pid = schedule.periodId || schedule.period;
    // If period is an object (from backend populate), extract its id
    if (pid && typeof pid === 'object') {
      pid = pid.id || pid._id;
    }
    return pid;
  }, []);

  // Filter sections based on selected teacher's eligibility
  const filteredSections = useMemo(() => {
    if (!selectedTeacherId) return sections;

    // Get teacher's eligible courses from preferences
    // Note: If no preference record exists, teacher is not eligible (or we assume strict mode)
    // Preference value doesn't strictly matter for "eligibility" unless we enforce "score > 0"
    // Usually simple existence of record implies ability to teach.
    // Also ensuring semester matches.
    const semester = getSelectedSemester();
    const eligibleCourseIds = coursePreferences
      .filter(cp =>
        (cp.teacherId === selectedTeacherId || (cp.teacher && cp.teacher.id === selectedTeacherId)) &&
        (!cp.semester || cp.semester === semester)
      )
      .map(cp => cp.courseId || (cp.course && cp.course.id));

    // Filter out sections that are already assigned (assigned assignments exist in 'schedules')
    const assignedSectionIds = schedules.map(s => s.sectionId);

    return sections.filter(s =>
      eligibleCourseIds.includes(s.courseId) &&
      !assignedSectionIds.includes(s.id)
    );
  }, [sections, selectedTeacherId, coursePreferences, schedules]);

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === formSectionId) || null,
    [sections, formSectionId]
  );

  const computeAvailableTimeOptions = useMemo(() => {
    if (!selectedTeacherId || !selectedSection) return [];

    const requiredPeriods = Number(selectedSection.periodRequired || 0);
    if (!requiredPeriods || requiredPeriods <= 0) return [];

    const teacherAllSchedules = schedules.filter((s) => s.teacherId === selectedTeacherId);
    const options = [];

    dayKeys.forEach((day) => {
      for (let startIdx = 0; startIdx <= periodIds.length - requiredPeriods; startIdx++) {
        const windowPeriods = periodIds.slice(startIdx, startIdx + requiredPeriods);

        const conflictTeacher = teacherAllSchedules.some(
          (s) => s.day === day && windowPeriods.includes(getPeriodId(s))
        );
        if (conflictTeacher) continue;

        const hasClassroom = classrooms.some((c) => {
          const id = c.id || c._id;
          if (!id) return false;
          if ((c.status && c.status !== "active") || (c.capacity || 0) < (selectedSection.requiredSeats || 0)) {
            return false;
          }
          const conflictRoom = schedules.some(
            (s) =>
              s.classroomId === id &&
              s.day === day &&
              windowPeriods.includes(getPeriodId(s))
          );
          return !conflictRoom;
        });

        if (!hasClassroom) continue;

        const startId = windowPeriods[0];
        const endId = windowPeriods[windowPeriods.length - 1];
        options.push({
          key: `${day}_${startId}_${endId}`,
          day,
          startPeriodId: startId,
          endPeriodId: endId,
          periodIds: windowPeriods,
        });
      }
    });

    return options;
  }, [selectedTeacherId, selectedSection, schedules, classrooms, dayKeys, periodIds]);

  const selectedTimeOption = useMemo(
    () => computeAvailableTimeOptions.find((opt) => opt.key === formTimeKey) || null,
    [computeAvailableTimeOptions, formTimeKey]
  );

  const availableClassroomsForSelection = useMemo(() => {
    if (!selectedTimeOption || !selectedSection) return [];
    const { day, periodIds: windowPeriods } = selectedTimeOption;

    return classrooms.filter((c) => {
      const id = c.id || c._id;
      if (!id) return false;
      if ((c.status && c.status !== "active") || (c.capacity || 0) < (selectedSection.requiredSeats || 0)) {
        return false;
      }
      const conflictRoom = schedules.some(
        (s) =>
          s.classroomId === id &&
          s.day === day &&
          windowPeriods.includes(getPeriodId(s))
      );
      return !conflictRoom;
    });
  }, [selectedTimeOption, selectedSection, classrooms, schedules]);

  const cellMatrix = useMemo(() => {
    const matrix = {};
    dayKeys.forEach((day) => {
      matrix[day] = {};
      periodIds.forEach((pid) => {
        matrix[day][pid] = { type: "empty" };
      });
    });

    if (teacherSchedules.length === 0) return matrix;

    const getIndex = (pid) => periodIds.indexOf(pid);

    dayKeys.forEach((day) => {
      const daySchedules = teacherSchedules.filter((s) => s.day === day);
      if (daySchedules.length === 0) return;

      const groups = new Map();
      daySchedules.forEach((s) => {
        const key = `${s.sectionId}|${s.classroomId}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push(s);
      });

      groups.forEach((list) => {
        // Use getPeriodId for sorting
        list.sort((a, b) => getIndex(getPeriodId(a)) - getIndex(getPeriodId(b)));

        let startIdx = 0;
        for (let i = 0; i < list.length; i++) {
          const isLast = i === list.length - 1;
          const currentPid = getPeriodId(list[i]);
          const currentIdx = getIndex(currentPid);
          const nextPid = !isLast ? getPeriodId(list[i + 1]) : null;
          const nextIdx = nextPid !== null ? getIndex(nextPid) : null;

          const isBreak = isLast || (nextIdx !== null && nextIdx !== currentIdx + 1);

          if (isBreak) {
            const first = list[startIdx];
            const last = list[i];
            const firstPid = getPeriodId(first);
            const lastPid = getPeriodId(last);

            const blockSchedules = list.slice(startIdx, i + 1);

            const firstIdx = getIndex(firstPid);
            const lastIdx = getIndex(lastPid);
            const span = lastIdx - firstIdx + 1;

            if (blockSchedules.length > 0 && firstIdx >= 0 && lastIdx >= 0) {
              const section = sections.find(s => s.id === first.sectionId);
              const classroom = classrooms.find(c => c.id === first.classroomId || c._id === first.classroomId);

              const block = {
                day,
                startPeriodId: firstPid,
                endPeriodId: lastPid,
                sectionName: section ? section.name : first.sectionId,
                sectionId: first.sectionId,
                classroomName: classroom ? classroom.name : first.classroomId,
                classroomId: first.classroomId,
                schedules: blockSchedules,
              };

              matrix[day][firstPid] = {
                type: "block",
                span,
                block,
              };

              for (let k = startIdx + 1; k <= i; k++) {
                const kPid = getPeriodId(list[k]);
                matrix[day][kPid] = { type: "spanned" };
              }
            }

            startIdx = i + 1;
          }
        }
      });
    });

    return matrix;
  }, [dayKeys, periodIds, teacherSchedules, getPeriodId, sections, classrooms]);

  const formatPeriodRange = (startId, endId) => {
    if (!startId) return "";
    if (!endId || startId === endId) return formatPeriodLabel(startId);
    return `${formatPeriodLabel(startId)} - ${formatPeriodLabel(endId)}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Xếp lịch</h2>
          {currentScheduleValue !== null && (
            <div className={styles.scheduleValue}>
              {typeof currentScheduleValue === 'object' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.valueLabel}>Tổng giá trị:</span>
                    <span className={styles.valueNumber}>
                      {evaluatingValue ? "..." : Math.round(currentScheduleValue.totalScore || 0)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <span>Workload Pen: {Math.round((currentScheduleValue.workloadPenalty || 0) * 10) / 10}</span>
                    <span>Compact Pen: {Math.round((currentScheduleValue.compactnessPenalty || 0) * 10) / 10}</span>
                    <span>Course Pref: {Math.round((currentScheduleValue.coursePreferenceScore || 0) * 10) / 10}</span>
                    <span>Time Pref: {Math.round((currentScheduleValue.timePreferenceScore || 0) * 10) / 10}</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className={styles.valueLabel}>Giá trị:</span>
                  <span className={styles.valueNumber}>
                    {evaluatingValue ? "..." : currentScheduleValue}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <div className={styles.scheduleSelector}>
            <label htmlFor="scheduleSelect">Lịch:</label>
            <select
              id="scheduleSelect"
              className={styles.scheduleSelect}
              value={selectedScheduleName || ""}
              onChange={async (e) => {
                const newScheduleName = e.target.value || null;
                setSelectedScheduleName(newScheduleName);
              }}
            >
              <option value="">-- Tất cả lịch --</option>
              {scheduleSets.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <button
            className={styles.btnCreateSchedule}
            onClick={handleCreateNewSchedule}
            title="Tạo một bản lịch mới rỗng"
          >
            ➕ Tạo lịch
          </button>
          <div className={styles.tabButtons}>
            <button
              className={activeTab === Tabs.VIEW ? styles.tabActive : ""}
              onClick={() => setActiveTab(Tabs.VIEW)}
            >
              Xem lịch
            </button>
            <button
              className={activeTab === Tabs.EDIT ? styles.tabActive : ""}
              onClick={() => setActiveTab(Tabs.EDIT)}
            >
              Chỉnh sửa thủ công
            </button>
          </div>
          <div className={styles.buttonGroup}>
            <button
              className={styles.generateButton}
              onClick={() => handleGenerate('heuristic')}
              disabled={generating || generatingExact}
              title="Chạy nhanh, kết quả gần tối ưu"
            >
              {generating ? "Đang chạy..." : "Xếp lịch (Heuristic)"}
            </button>
            <button
              className={`${styles.generateButton} ${styles.exactButton}`}
              onClick={() => handleGenerate('exact')}
              disabled={generating || generatingExact}
              title="Chạy lâu, kết quả tối ưu (chỉ dùng cho dữ liệu nhỏ)"
              style={{ backgroundColor: '#8e44ad', marginLeft: '8px' }}
            >
              {generatingExact ? "Đang giải..." : "Xếp lịch (Exact)"}
            </button>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {(loading || metaLoading) ? (
        <div className={styles.loading}>Đang tải lịch phân công...</div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.schedulePanel}>
            <div className={styles.teacherFilterBottom}>
              <label htmlFor="teacherSelectBottom">Lọc theo giảng viên:</label>
              <select
                id="teacherSelectBottom"
                className={styles.teacherSelectBottom}
                value={selectedTeacherId || ""}
                onChange={(e) => setSelectedTeacherId(e.target.value || null)}
              >
                <option value="">-- Tất cả giảng viên --</option>
                {teachers.map((t) => {
                  const id = t.id || t._id;
                  const displayName = t.name || id;
                  return (
                    <option key={id} value={id}>
                      {displayName} ({id})
                    </option>
                  );
                })}
              </select>
            </div>
            {activeTab === Tabs.EDIT && (
              <div className={styles.editPanel}>
                {!showAddForm ? (
                  <button
                    className={styles.btnShowAddForm}
                    onClick={() => setShowAddForm(true)}
                  >
                    Thêm lịch phân công
                  </button>
                ) : (
                  <>
                    <div className={styles.formHeader}>
                      <h3>Thêm lịch phân công thủ công</h3>
                      <button
                        className={styles.btnCloseForm}
                        onClick={() => {
                          setShowAddForm(false);
                          setFormSectionId("");
                          setFormTimeKey("");
                          setFormClassroomId("");
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Học phần</label>
                        <select
                          value={formSectionId}
                          onChange={(e) => {
                            setFormSectionId(e.target.value);
                            setFormTimeKey("");
                            setFormClassroomId("");
                          }}
                        >
                          <option value="">-- Chọn học phần --</option>
                          {filteredSections.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.id})
                            </option>
                          ))}
                        </select>
                        {selectedSection && (
                          <div className={styles.helperText}>
                            Cần {selectedSection.periodRequired} kíp liên tiếp, {selectedSection.requiredSeats} chỗ.
                          </div>
                        )}
                      </div>
                      <div className={styles.formGroup}>
                        <label>Khoảng thời gian (kíp liên tiếp trống)</label>
                        <select
                          value={formTimeKey}
                          onChange={(e) => {
                            setFormTimeKey(e.target.value);
                            setFormClassroomId("");
                          }}
                          disabled={!selectedTeacherId || !formSectionId}
                        >
                          <option value="">
                            {(!selectedTeacherId || !formSectionId)
                              ? "-- Chọn giảng viên & học phần trước --"
                              : computeAvailableTimeOptions.length === 0
                                ? "Không còn khoảng thời gian trống phù hợp"
                                : "-- Chọn khoảng thời gian --"}
                          </option>
                          {computeAvailableTimeOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {formatDay(opt.day)}: {formatPeriodRange(opt.startPeriodId, opt.endPeriodId)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Lớp học (phòng trống & đủ chỗ)</label>
                        <select
                          value={formClassroomId}
                          onChange={(e) => setFormClassroomId(e.target.value)}
                          disabled={!selectedTimeOption}
                        >
                          <option value="">
                            {!selectedTimeOption
                              ? "-- Chọn khoảng thời gian trước --"
                              : availableClassroomsForSelection.length === 0
                                ? "Không còn phòng phù hợp"
                                : "-- Chọn phòng học --"}
                          </option>
                          {availableClassroomsForSelection.map((c) => {
                            const id = c.id || c._id;
                            return (
                              <option key={id} value={id}>
                                {c.name} ({id}) - {c.capacity} chỗ
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    <div className={styles.formActions}>
                      <button
                        className={styles.btnAddManual}
                        disabled={
                          !selectedTeacherId ||
                          !formSectionId ||
                          !selectedTimeOption ||
                          !formClassroomId
                        }
                        onClick={async () => {
                          if (
                            !selectedTeacherId ||
                            !formSectionId ||
                            !selectedTimeOption ||
                            !formClassroomId
                          ) {
                            toast.warning("Vui lòng chọn đầy đủ thông tin.");
                            return;
                          }
                          try {
                            const semester = getSelectedSemester();
                            if (!semester) {
                              toast.warning("Vui lòng chọn học kỳ trước.");
                              return;
                            }
                            // Phải chọn một schedule cụ thể để thêm lịch thủ công
                            if (!selectedScheduleName) {
                              toast.warning("Vui lòng chọn một lịch cụ thể hoặc tạo lịch mới trước khi thêm lịch phân công.");
                              return;
                            }

                            // Load current schedule to get existing assignments
                            const currentSchedules = await scheduleAPI.list({ semester, name: selectedScheduleName });
                            const currentSchedule = Array.isArray(currentSchedules) && currentSchedules.length > 0
                              ? currentSchedules[0]
                              : null;

                            // Get existing assignments or create new array
                            const existingAssignments = currentSchedule?.assignments || [];

                            // Convert day from "MONDAY" to "Mon"
                            const dayMap = {
                              "MONDAY": "Mon",
                              "TUESDAY": "Tue",
                              "WEDNESDAY": "Wed",
                              "THURSDAY": "Thu",
                              "FRIDAY": "Fri",
                              "SATURDAY": "Sat",
                              "SUNDAY": "Sun"
                            };
                            const dayShort = dayMap[selectedTimeOption.day] || selectedTimeOption.day;

                            // Add new assignments for each period
                            const newAssignments = selectedTimeOption.periodIds.map((pid) => {
                              // Convert period ID to order index
                              const periodIndex = PERIODS.findIndex(p => p.id === pid);
                              const periodOrder = periodIndex >= 0 ? (periodIndex + 1).toString() : "1";

                              return {
                                teacherId: selectedTeacherId,
                                sectionId: formSectionId,
                                classroomId: formClassroomId,
                                day: dayShort,
                                period: periodOrder
                              };
                            });

                            // Merge with existing assignments
                            const updatedAssignments = [...existingAssignments, ...newAssignments];

                            // Calculate statistics
                            const teacherIds = new Set(updatedAssignments.map(a => a.teacherId));
                            const classroomIds = new Set(updatedAssignments.map(a => a.classroomId));
                            const sectionIds = new Set(updatedAssignments.map(a => a.sectionId));

                            // Get course IDs from sections
                            const courseIds = new Set();
                            for (const sectionId of sectionIds) {
                              const section = sections.find(s => s.id === sectionId);
                              if (section && section.courseId) {
                                courseIds.add(section.courseId);
                              }
                            }

                            const statistics = {
                              numAssignments: updatedAssignments.length,
                              numClassrooms: classroomIds.size,
                              numCourses: courseIds.size,
                              numSections: sectionIds.size,
                              numTeachers: teacherIds.size
                            };

                            // Update or create schedule
                            const scheduleId = currentSchedule?.id || `${selectedScheduleName}_${semester}`;
                            const scheduleData = {
                              id: scheduleId,
                              semester,
                              name: selectedScheduleName,
                              assignments: updatedAssignments,
                              statistics
                            };

                            if (currentSchedule) {
                              await scheduleAPI.update(scheduleId, scheduleData);
                            } else {
                              await scheduleAPI.create(scheduleData);
                            }
                            toast.success("Thêm lịch phân công thành công.");
                            setFormTimeKey("");
                            setFormClassroomId("");
                            setFormSectionId("");
                            setShowAddForm(false);
                            // Reload and re-evaluate
                            await refreshSchedulesAndEvaluate();
                          } catch (err) {
                            console.error(err);
                            toast.error("Thêm lịch phân công thất bại: " + (err.message || ""));
                          }
                        }}
                      >
                        Thêm vào lịch
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {!selectedScheduleName ? (
              <div className={styles.empty}>
                {scheduleSets.length === 0
                  ? "Chưa có lịch nào. Hãy tạo lịch mới để bắt đầu."
                  : "Vui lòng chọn một lịch cụ thể từ dropdown ở trên để xem chi tiết."}
              </div>
            ) : schedules.length === 0 ? (
              <div className={styles.empty}>
                Lịch "<strong>{selectedScheduleName}</strong>" chưa có phân công nào. Nhấn "Xếp lịch tự động" để tạo lịch từ các đăng ký dạy học đã được phê duyệt.
              </div>
            ) : selectedTeacherId && teacherSchedules.length === 0 ? (
              <div className={styles.empty}>
                Giảng viên <strong>{selectedTeacher?.name || selectedTeacher?.id || selectedTeacher?._id || selectedTeacherId}</strong> chưa
                có phân công nào trong lịch "<strong>{selectedScheduleName}</strong>".
              </div>
            ) : schedules.length > 0 && (
              <div className={styles.scheduleTable}>
                {selectedTeacherId && selectedTeacher && (
                  <div className={styles.selectedTeacherHeader}>
                    <div className={styles.selectedTeacherInfo}>
                      <div className={styles.teacherAvatarLarge}>
                        {selectedTeacher.avatar ? (
                          <img
                            src={selectedTeacher.avatar}
                            alt={selectedTeacher.name}
                            className={styles.teacherAvatarImg}
                          />
                        ) : (
                          <span>
                            {(selectedTeacher.name || selectedTeacher.id || selectedTeacher._id || "?")
                              .toString()
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3>Lịch phân công của {selectedTeacher.name || selectedTeacher.id || selectedTeacher._id}</h3>
                        <span className={styles.selectedTeacherId}>
                          Mã: {selectedTeacher.id || selectedTeacher._id}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <table>
                  <thead>
                    <tr>
                      <th>Ca / Thứ</th>
                      {dayKeys.map((day) => (
                        <th key={day}>{formatDay(day)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period) => (
                      <tr key={period.id}>
                        <td className={styles.periodCol}>{formatPeriodLabel(period.id)}</td>
                        {dayKeys.map((day) => {
                          const cell = cellMatrix[day]?.[period.id];

                          if (!cell || cell.type === "empty") {
                            return (
                              <td key={day} className={styles.cell}>
                                <span className={styles.emptyCell}>-</span>
                              </td>
                            );
                          }

                          if (cell.type === "spanned") {
                            return null;
                          }

                          const block = cell.block;

                          return (
                            <td
                              key={day}
                              className={styles.cell}
                              rowSpan={cell.span}
                              onClick={() => {
                                if (activeTab === Tabs.VIEW) {
                                  setSelectedBlock(block);
                                }
                              }}
                            >
                              <div className={styles.cellItem}>
                                <div className={styles.cellContent}>
                                  <div className={styles.cellSection}>
                                    {block.sectionName || block.sectionId}
                                  </div>
                                  <div className={styles.classroomInfo}>
                                    {block.classroomName || block.classroomId}
                                  </div>
                                </div>
                                {activeTab === Tabs.EDIT && (
                                  <button
                                    className={styles.cellDeleteBtn}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmModal({
                                        message: `Xóa phân công: ${block.sectionName || block.sectionId} - ${block.classroomName || block.classroomId}?`,
                                        onConfirm: async () => {
                                          try {
                                            const scheduleIdsToDelete = (block.schedules || []).map((s) => s.id);
                                            await Promise.all(
                                              scheduleIdsToDelete.map((id) => scheduleAPI.remove(id))
                                            );
                                            toast.success("Xóa phân công thành công.");
                                            // Reload and re-evaluate
                                            await refreshSchedulesAndEvaluate();
                                          } catch (err) {
                                            console.error(err);
                                            toast.error("Xóa thất bại: " + (err.message || ""));
                                          }
                                          setConfirmModal(null);
                                        },
                                        onCancel: () => setConfirmModal(null),
                                      });
                                    }}
                                    title="Xóa phân công này"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {schedules.length > 0 && (
              <div className={styles.scheduleFooter}>
                <div className={styles.scheduleInfo}>
                  {currentScheduleValue !== null && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Tổng giá trị:</span>
                      <span className={styles.infoValue}>
                        {evaluatingValue
                          ? "Đang tính..."
                          : (typeof currentScheduleValue === 'object'
                            ? Math.round(currentScheduleValue.totalScore || 0)
                            : currentScheduleValue)}
                      </span>
                    </div>
                  )}
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Tổng số phân công:</span>
                    <span className={styles.infoValue}>{schedules.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Button at the bottom */}
            {selectedScheduleName && (
              <div className={styles.deleteZone} style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className={styles.btnDeleteSchedule}
                  onClick={handleClearSchedules}
                  disabled={generating || generatingExact}
                  title="Xóa phiên bản lịch này vĩnh viễn"
                >
                  🗑️ Xóa lịch "{selectedScheduleName}"
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === Tabs.VIEW && selectedBlock && selectedTeacher && (
        <div className={styles.modal} onClick={() => setSelectedBlock(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Thông tin chi tiết phân công</h3>
              <button className={styles.closeBtn} onClick={() => setSelectedBlock(null)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <table className={styles.detailTable}>
                <tbody>
                  <tr>
                    <th>Giảng viên</th>
                    <td>{selectedTeacher.name || selectedTeacher.id || selectedTeacher._id}</td>
                  </tr>
                  <tr>
                    <th>Học phần</th>
                    <td>{selectedBlock.sectionName || selectedBlock.sectionId}</td>
                  </tr>
                  <tr>
                    <th>Lớp</th>
                    <td>{selectedBlock.classroomName || selectedBlock.classroomId}</td>
                  </tr>
                  <tr>
                    <th>Thứ</th>
                    <td>{formatDay(selectedBlock.day)}</td>
                  </tr>
                  <tr>
                    <th>Ca</th>
                    <td>{formatPeriodRange(selectedBlock.startPeriodId, selectedBlock.endPeriodId)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className={styles.modal} onClick={() => confirmModal.onCancel()}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Xác nhận</h3>
              <button className={styles.closeBtn} onClick={() => confirmModal.onCancel()}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>{confirmModal.message}</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => confirmModal.onCancel()}
              >
                Hủy
              </button>
              <button
                className={styles.btnConfirm}
                onClick={() => confirmModal.onConfirm()}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptModal && (
        <div className={styles.modal} onClick={() => promptModal.onCancel()}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{promptModal.title}</h3>
              <button className={styles.closeBtn} onClick={() => promptModal.onCancel()}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>{promptModal.message}</p>
              <input
                type="text"
                className={styles.promptInput}
                defaultValue={promptModal.defaultValue}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    promptModal.onConfirm(e.target.value);
                  } else if (e.key === "Escape") {
                    promptModal.onCancel();
                  }
                }}
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => promptModal.onCancel()}
              >
                Hủy
              </button>
              <button
                className={styles.btnConfirm}
                onClick={() => {
                  const input = document.querySelector(`.${styles.promptInput}`);
                  promptModal.onConfirm(input?.value || "");
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
