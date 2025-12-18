import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import styles from "./Schedule.module.css";
import scheduleAPI from "../../api/schedule";
import { getSelectedSemester } from "../../api";
import { teachersAPI } from "../../api/teachers";
import { PERIODS } from "../../api/timeSlots";
import { sectionAPI } from "../../api/section";
import { classroomAPI } from "../../api/classroom";

const Tabs = { VIEW: "view", EDIT: "edit" };

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState(Tabs.VIEW);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const [scheduleVersions, setScheduleVersions] = useState([]);
  const [currentVersionId, setCurrentVersionId] = useState(null);
  const [currentScheduleValue, setCurrentScheduleValue] = useState(null);
  const [evaluatingValue, setEvaluatingValue] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formSectionId, setFormSectionId] = useState("");
  const [formTimeKey, setFormTimeKey] = useState("");
  const [formClassroomId, setFormClassroomId] = useState("");

  const [confirmModal, setConfirmModal] = useState(null);
  const [promptModal, setPromptModal] = useState(null);

  const getStorageKey = () => {
    const semester = getSelectedSemester();
    return `schedule_versions_${semester || "default"}`;
  };

  const loadVersions = () => {
    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const versions = JSON.parse(stored);
        setScheduleVersions(versions);
        if (versions.length > 0 && !currentVersionId) {
          setCurrentVersionId(versions[0].id);
        }
        return versions;
      }
      return [];
    } catch (err) {
      console.error("Error loading versions:", err);
      return [];
    }
  };

  const saveVersions = (versions) => {
    try {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(versions));
      setScheduleVersions(versions);
    } catch (err) {
      console.error("Error saving versions:", err);
    }
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const semester = getSelectedSemester();
      const data = await scheduleAPI.list({ semester });
      const allSchedules = Array.isArray(data) ? data : [];
      
      let versions = loadVersions();
      
      if (versions.length === 0 && allSchedules.length > 0) {
        const defaultVersion = {
          id: `version_${Date.now()}`,
          name: "Cách xếp lịch 1",
          schedules: allSchedules,
          createdAt: new Date().toISOString(),
        };
        versions = [defaultVersion];
        saveVersions(versions);
        setCurrentVersionId(defaultVersion.id);
      } else if (versions.length === 0) {
        const defaultVersion = {
          id: `version_${Date.now()}`,
          name: "Cách xếp lịch 1",
          schedules: [],
          createdAt: new Date().toISOString(),
        };
        versions = [defaultVersion];
        saveVersions(versions);
        setCurrentVersionId(defaultVersion.id);
      }
      
      if (currentVersionId && versions.length > 0) {
        const currentVersion = versions.find((v) => v.id === currentVersionId);
        if (currentVersion) {
          setSchedules(currentVersion.schedules || []);
        } else {
          setSchedules(allSchedules);
        }
      } else if (versions.length > 0) {
        setCurrentVersionId(versions[0].id);
        setSchedules(versions[0].schedules || []);
      } else {
        setSchedules(allSchedules);
      }
    } catch (err) {
      const errorMsg = err.message || "Không thể tải lịch phân công";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Error loading schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSchedulesToDatabase = async (schedulesToSave) => {
    try {
      const semester = getSelectedSemester();
      if (!semester) {
        console.warn("No semester selected, skipping database save");
        return;
      }

      const existingSchedules = await scheduleAPI.list({ semester });
      const existingIds = (existingSchedules || []).map((s) => s.id);

      if (existingIds.length > 0) {
        await Promise.all(existingIds.map((id) => scheduleAPI.remove(id)));
      }

      if (schedulesToSave.length > 0) {
        await Promise.all(
          schedulesToSave.map((schedule) => scheduleAPI.create(schedule))
        );
      }
    } catch (err) {
      console.error("Error saving schedules to database:", err);
      toast.error("Lỗi khi lưu lịch vào database: " + (err.message || ""));
    }
  };

  const evaluateScheduleValue = async () => {
    try {
      setEvaluatingValue(true);
      const semester = getSelectedSemester();
      if (!semester) {
        setCurrentScheduleValue(null);
        return;
      }
      const value = await scheduleAPI.evaluate(semester);
      setCurrentScheduleValue(value);
      
      if (currentVersionId) {
        const updated = scheduleVersions.map((v) =>
          v.id === currentVersionId ? { ...v, objectiveValue: value } : v
        );
        saveVersions(updated);
      }
    } catch (err) {
      console.error("Error evaluating schedule value:", err);
      setCurrentScheduleValue(null);
    } finally {
      setEvaluatingValue(false);
    }
  };

  const updateCurrentVersionSchedules = async (newSchedules) => {
    if (!currentVersionId) {
      const newId = createNewVersion();
      const updated = scheduleVersions.map((v) =>
        v.id === newId ? { ...v, schedules: newSchedules } : v
      );
      saveVersions(updated);
      setSchedules(newSchedules);
      await saveSchedulesToDatabase(newSchedules);
      await evaluateScheduleValue();
      return;
    }
    const updated = scheduleVersions.map((v) =>
      v.id === currentVersionId ? { ...v, schedules: newSchedules } : v
    );
    saveVersions(updated);
    setSchedules(newSchedules);
    await saveSchedulesToDatabase(newSchedules);
    await evaluateScheduleValue();
  };

  const createNewVersion = (name = null) => {
    const newId = `version_${Date.now()}`;
    const newName = name || `Cách xếp lịch ${scheduleVersions.length + 1}`;
    const newVersion = {
      id: newId,
      name: newName,
      schedules: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...scheduleVersions, newVersion];
    saveVersions(updated);
    setCurrentVersionId(newId);
    setSchedules([]);
    return newId;
  };

  const deleteVersion = (versionId) => {
    setConfirmModal({
      message: "Xác nhận xóa cách xếp lịch này?",
      onConfirm: () => {
        const updated = scheduleVersions.filter((v) => v.id !== versionId);
        
        if (updated.length === 0) {
          const newId = `version_${Date.now()}`;
          const newVersion = {
            id: newId,
            name: "Cách xếp lịch 1",
            schedules: [],
            objectiveValue: null,
            createdAt: new Date().toISOString(),
          };
          saveVersions([newVersion]);
          setCurrentVersionId(newId);
          setSchedules([]);
          setCurrentScheduleValue(null);
        } else {
          saveVersions(updated);
          
          if (currentVersionId === versionId) {
            setCurrentVersionId(updated[0].id);
            const versionSchedules = updated[0].schedules || [];
            setSchedules(versionSchedules);
            if (updated[0].objectiveValue !== null && updated[0].objectiveValue !== undefined) {
              setCurrentScheduleValue(updated[0].objectiveValue);
            } else {
              evaluateScheduleValue();
            }
          }
        }
        
        toast.success("Đã xóa cách xếp lịch.");
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const switchVersion = async (versionId) => {
    const version = scheduleVersions.find((v) => v.id === versionId);
    if (version) {
      setCurrentVersionId(versionId);
      const versionSchedules = version.schedules || [];
      setSchedules(versionSchedules);
      if (version.objectiveValue !== null && version.objectiveValue !== undefined) {
        setCurrentScheduleValue(version.objectiveValue);
      } else {
        await evaluateScheduleValue();
      }
      await saveSchedulesToDatabase(versionSchedules);
    }
  };

  const loadTeachers = async () => {
    try {
      setTeachersLoading(true);
      const data = await teachersAPI.list();
      setTeachers(Array.isArray(data) ? data : []);
      if (data && data.length > 0 && !selectedTeacherId) {
        const firstId = data[0].id || data[0]._id;
        setSelectedTeacherId(firstId);
      }
    } catch (err) {
      console.error("Error loading teachers:", err);
    } finally {
      setTeachersLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      setMetaLoading(true);
      const [{ items: sectionItems }, classroomItems] = await Promise.all([
        sectionAPI.list(),
        classroomAPI.list(),
      ]);
      setSections(sectionItems || []);
      setClassrooms(classroomItems || []);
    } catch (err) {
      console.error("Error loading sections/classrooms:", err);
    } finally {
      setMetaLoading(false);
    }
  };

  const isCurrentVersionEmpty = useMemo(() => {
    if (!schedules || schedules.length === 0) return true;
    if (currentVersionId) {
      const currentVersion = scheduleVersions.find(v => v.id === currentVersionId);
      if (currentVersion && currentVersion.schedules && currentVersion.schedules.length > 0) {
        return false;
      }
    }
    return true;
  }, [currentVersionId, scheduleVersions, schedules]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      const semester = getSelectedSemester();
      if (!semester) {
        setError("Please select a semester first");
        return;
      }
      const data = await scheduleAPI.generate(semester);
      const newSchedules = Array.isArray(data?.schedules) ? data.schedules : (Array.isArray(data) ? data : []);
      const objectiveValue = data?.objectiveValue ?? null;
      
      if (currentVersionId && isCurrentVersionEmpty) {
        const updated = scheduleVersions.map((v) =>
          v.id === currentVersionId
            ? {
                ...v,
                schedules: newSchedules,
                objectiveValue: objectiveValue,
                createdAt: v.createdAt || new Date().toISOString(),
              }
            : v
        );
        saveVersions(updated);
        setSchedules(newSchedules);
        setCurrentScheduleValue(objectiveValue);
      } else {
        const newId = `version_${Date.now()}`;
        const newName = `Tự động tạo - ${new Date().toLocaleString("vi-VN")}`;
        const newVersion = {
          id: newId,
          name: newName,
          schedules: newSchedules,
          objectiveValue: objectiveValue,
          createdAt: new Date().toISOString(),
        };
        const updated = [...scheduleVersions, newVersion];
        saveVersions(updated);
        setCurrentVersionId(newId);
        setSchedules(newSchedules);
        setCurrentScheduleValue(objectiveValue);
      }
      
      toast.success(`Tạo lịch thành công! Đã tạo ${newSchedules.length} phân công.`);
    } catch (err) {
      let errorMsg = err.message || "Không thể tạo lịch tự động";
      
      if (errorMsg.includes("Không thể tạo lịch tự động")) {
        setError(errorMsg);
        toast.error(errorMsg, { autoClose: 5000 });
      } else {
        setError(errorMsg);
        toast.error(errorMsg);
      }
      console.error("Error generating schedule:", err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadVersions();
    loadSchedules();
    loadTeachers();
    loadMeta();
  }, []);

  useEffect(() => {
    if (currentVersionId) {
      loadSchedules();
    }
  }, [currentVersionId]);

  useEffect(() => {
    if (schedules.length > 0) {
      evaluateScheduleValue();
    }
  }, [schedules]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => (t.id || t._id) === selectedTeacherId) || null,
    [teachers, selectedTeacherId]
  );

  const teacherSchedules = useMemo(
    () =>
      selectedTeacherId
        ? schedules.filter((s) => s.teacherId === selectedTeacherId)
        : [],
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
          (s) => s.day === day && windowPeriods.includes(s.period)
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
              windowPeriods.includes(s.period)
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
          windowPeriods.includes(s.period)
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

    if (!selectedTeacherId || teacherSchedules.length === 0) return matrix;

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
        list.sort((a, b) => getIndex(a.period) - getIndex(b.period));

        let startIdx = 0;
        for (let i = 0; i < list.length; i++) {
          const isLast = i === list.length - 1;
          const currentIdx = getIndex(list[i].period);
          const nextIdx = !isLast ? getIndex(list[i + 1].period) : null;
          
          const isBreak = isLast || (nextIdx !== null && nextIdx !== currentIdx + 1);

          if (isBreak) {
            const first = list[startIdx];
            const last = list[i];
            
            const blockSchedules = list.slice(startIdx, i + 1);
            
            const firstIdx = getIndex(first.period);
            const lastIdx = getIndex(last.period);
            const span = lastIdx - firstIdx + 1;
            
            if (blockSchedules.length > 0) {
              const block = {
                day,
                startPeriodId: first.period,
                endPeriodId: last.period,
                sectionName: first.sectionName,
                sectionId: first.sectionId,
                classroomName: first.classroomName,
                classroomId: first.classroomId,
                schedules: blockSchedules,
              };

              matrix[day][first.period] = {
                type: "block",
                span,
                block,
              };

              for (let k = startIdx + 1; k <= i; k++) {
                matrix[day][list[k].period] = { type: "spanned" };
              }
            }

            startIdx = i + 1;
          }
        }
      });
    });

    return matrix;
  }, [dayKeys, periodIds, selectedTeacherId, teacherSchedules]);

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
              <span className={styles.valueLabel}>Giá trị:</span>
              <span className={styles.valueNumber}>
                {evaluatingValue ? "..." : currentScheduleValue}
              </span>
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <div className={styles.versionSelector}>
            <label>Cách xếp lịch:</label>
            <select
              value={currentVersionId || ""}
              onChange={(e) => switchVersion(e.target.value)}
              className={styles.versionSelect}
            >
              {scheduleVersions.length === 0 ? (
                <option value="">Chưa có cách xếp lịch</option>
              ) : (
                scheduleVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))
              )}
            </select>
            <button
              className={styles.btnNewVersion}
              onClick={() => {
                setPromptModal({
                  title: "Thêm cách xếp lịch mới",
                  message: "Nhập tên cho cách xếp lịch mới:",
                  defaultValue: "",
                  onConfirm: (name) => {
                    if (name && name.trim()) {
                      createNewVersion(name.trim());
                    } else {
                      toast.warning("Vui lòng nhập tên cho cách xếp lịch.");
                    }
                    setPromptModal(null);
                  },
                  onCancel: () => setPromptModal(null),
                });
              }}
            >
              Thêm mới
            </button>
          </div>
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
        <button
          className={styles.generateButton}
          onClick={handleGenerate}
          disabled={generating || !isCurrentVersionEmpty}
          title={!isCurrentVersionEmpty ? "Cách xếp lịch hiện tại đã có dữ liệu. Vui lòng tạo cách xếp lịch mới hoặc xóa dữ liệu hiện tại." : ""}
        >
          {generating ? "Đang tạo lịch..." : "Tạo lịch tự động"}
        </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {(loading || metaLoading) ? (
        <div className={styles.loading}>Đang tải lịch phân công...</div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.teacherPanel}>
            <h3>Giảng viên</h3>
            {teachersLoading ? (
              <div className={styles.loading}>Đang tải danh sách giảng viên...</div>
            ) : teachers.length === 0 ? (
              <div className={styles.empty}>Chưa có giảng viên nào.</div>
            ) : (
              <ul className={styles.teacherList}>
                {teachers.map((t) => {
                  const id = t.id || t._id;
                  const active = id === selectedTeacherId;
                  const displayName = t.name || id;
                  const initial = (displayName || "?").toString().charAt(0).toUpperCase();
                  return (
                    <li
                      key={id}
                      className={`${styles.teacherItem} ${active ? styles.teacherItemActive : ""}`}
                      onClick={() => setSelectedTeacherId(id)}
                    >
                      <div className={styles.teacherItemInner}>
                        <div className={styles.teacherAvatarSmall}>
                          {t.avatar ? (
                            <img
                              src={t.avatar}
                              alt={displayName}
                              className={styles.teacherAvatarImg}
                            />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>
                        <div>
                          <div className={styles.teacherName}>{displayName}</div>
                          <div className={styles.teacherId}>Mã: {id}</div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={styles.schedulePanel}>
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
                      {sections.map((s) => (
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
                        const { day, periodIds: windowPeriods } = selectedTimeOption;
                        const newSchedules = await Promise.all(
                          windowPeriods.map((pid) =>
                            scheduleAPI.create({
                              id: `${selectedTeacherId}_${formSectionId}_${day}_${pid}_${formClassroomId}`,
                              semester,
                              teacherId: selectedTeacherId,
                              sectionId: formSectionId,
                              classroomId: formClassroomId,
                              day,
                              period: pid,
                            })
                          )
                        );
                        toast.success("Thêm lịch phân công thành công.");
                        setFormTimeKey("");
                        setFormClassroomId("");
                        setFormSectionId("");
                        const updatedSchedules = [...schedules, ...newSchedules];
                        updateCurrentVersionSchedules(updatedSchedules);
                        setShowAddForm(false);
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

            {!selectedTeacher ? (
              <div className={styles.empty}>
                Chọn một giảng viên ở bên trái để xem bảng lịch phân công.
              </div>
      ) : schedules.length === 0 ? (
        <div className={styles.empty}>
                Chưa có lịch học nào. Nhấn "Tạo lịch tự động" để tạo lịch từ các đăng ký dạy học đã được phê duyệt.
              </div>
            ) : teacherSchedules.length === 0 ? (
              <div className={styles.empty}>
                Giảng viên <strong>{selectedTeacher.name || selectedTeacher.id || selectedTeacher._id}</strong> chưa
                có phân công nào trong học kỳ hiện tại.
        </div>
      ) : null}
            {(selectedTeacher && schedules.length > 0 && teacherSchedules.length > 0) && (
        <div className={styles.scheduleTable}>
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
                                            const updatedSchedules = schedules.filter(
                                              (s) => !scheduleIdsToDelete.includes(s.id)
                                            );
                                            updateCurrentVersionSchedules(updatedSchedules);
                                            toast.success("Xóa phân công thành công.");
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
            {currentVersionId && (
              <div className={styles.scheduleFooter}>
                <div className={styles.scheduleInfo}>
                  {currentScheduleValue !== null && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Tổng giá trị:</span>
                      <span className={styles.infoValue}>
                        {evaluatingValue ? "Đang tính..." : currentScheduleValue}
                      </span>
                    </div>
                  )}
                  {(() => {
                    const currentVersion = scheduleVersions.find(v => v.id === currentVersionId);
                    if (currentVersion && currentVersion.createdAt) {
                      const createdDate = new Date(currentVersion.createdAt);
                      return (
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Thời gian tạo:</span>
                          <span className={styles.infoValue}>
                            {createdDate.toLocaleString("vi-VN")}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <button
                  className={styles.btnDeleteVersion}
                  onClick={() => deleteVersion(currentVersionId)}
                  title="Xóa cách xếp lịch này"
                >
                  Xóa cách xếp lịch này
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
