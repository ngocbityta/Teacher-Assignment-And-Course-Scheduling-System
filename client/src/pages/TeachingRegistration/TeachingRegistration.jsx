import React, { useEffect, useState } from "react";
import styles from "./TeachingRegistration.module.css";
import { teachingRegistrationAPI } from "../../api/teachingRegistration";
import { teachersAPI } from "../../api/teachers";
import { coursesAPI } from "../../api/courses";
import { PERIODS } from "../../api/timeSlots";
import { timePreferenceAPI } from "../../api/timePreference";
import { coursePreferenceAPI } from "../../api/coursePreference";
import { getSelectedSemester } from "../../api/index";

const DAYS = [
  { key: "MONDAY", label: "Thứ 2" },
  { key: "TUESDAY", label: "Thứ 3" },
  { key: "WEDNESDAY", label: "Thứ 4" },
  { key: "THURSDAY", label: "Thứ 5" },
  { key: "FRIDAY", label: "Thứ 6" },
];

function genId(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

const TeachingRegistration = () => {
  const [activeTab, setActiveTab] = useState("PENDING");
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // detail/expand
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState({ timePrefs: [], coursePrefs: [] });

  // create flow
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    teacherId: "",
    semester: "",
    maxCourses: 1,
  });
  const [timeGrid, setTimeGrid] = useState({});
  const [coursePrefs, setCoursePrefs] = useState({});

  const loadAll = async () => {
    setLoading(true);
    try {
      const [registrations, teacherItems, coursePage] = await Promise.all([
        teachingRegistrationAPI.list(),
        teachersAPI.list(),
        coursesAPI.list(),
      ]);
      setAllRegistrations(registrations || []);
      setAllTeachers(teacherItems || []);
      setCourses(coursePage?.items || []);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAvailableTeachers = async () => {
    const semester = getSelectedSemester();
    if (!semester) {
      alert("Vui lòng chọn học kỳ trong Cài đặt trước khi tạo đăng ký dạy học.");
      return;
    }
    try {
      const available = await teachersAPI.getAvailableForRegistration(semester);
      setAvailableTeachers(available || []);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải danh sách giảng viên: " + err.message);
    }
  };

  const openDetail = async (id) => {
    if (!id) return;
    setExpandedId(expandedId === id ? null : id);
    if (expandedId === id) return setDetail({ timePrefs: [], coursePrefs: [] });
    try {
      const [reg, allTime, allCourse] = await Promise.all([
        teachingRegistrationAPI.get(id),
        timePreferenceAPI.list(),
        coursePreferenceAPI.list(),
      ]);
      const timePrefs = (allTime || []).filter((t) => t.teachingRegistrationId === id);
      const coursePrefs = (allCourse || []).filter(
        (c) => c.teachingRegistrationId === id
      );
      setDetail({ reg, timePrefs, coursePrefs });
    } catch (err) {
      console.error(err);
    }
  };

  const initGrid = () => {
    const p = PERIODS || [];
    const grid = {};
    for (const d of DAYS) {
      grid[d.key] = {};
      for (const per of p) grid[d.key][per.id] = 0;
    }
    setTimeGrid(grid);
  };

  const startCreate = async () => {
    setForm({ teacherId: "", maxCourses: 1 });
    initGrid();
    setCoursePrefs({});
    setStep(1);
    setShowCreate(true);
    await loadAvailableTeachers();
  };

  const updateGridValue = (dayKey, periodId, value) => {
    setTimeGrid((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [periodId]: Number(value || 0) },
    }));
  };

  const toggleCourseSelect = (courseId) => {
    setCoursePrefs((prev) => {
      const exists = prev[courseId] !== undefined;
      if (exists) {
        const next = { ...prev };
        delete next[courseId];
        return next;
      }
      return { ...prev, [courseId]: 1 };
    });
  };

  const setCoursePrefValue = (courseId, v) =>
    setCoursePrefs((prev) => ({ ...prev, [courseId]: Number(v || 0) }));

  const handleApprove = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn duyệt đăng ký này?")) return;
    try {
      await teachingRegistrationAPI.approve(id);
      alert("Đã duyệt đăng ký thành công");
      loadAll();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi duyệt đăng ký: " + err.message);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn từ chối đăng ký này?")) return;
    try {
      await teachingRegistrationAPI.reject(id);
      alert("Đã từ chối đăng ký thành công");
      loadAll();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi từ chối đăng ký: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đăng ký này? Hành động này không thể hoàn tác.")) return;
    try {
      await teachingRegistrationAPI.remove(id);
      alert("Đã xóa đăng ký thành công");
      loadAll();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa đăng ký: " + err.message);
    }
  };

  const handleConfirmCreate = async () => {
    if (!form.teacherId) return alert("Vui lòng chọn giảng viên");
    if (Number(form.maxCourses || 0) < 1)
      return alert("Số học phần tối đa phải >= 1");
    const semester = getSelectedSemester();
    if (!semester)
      return alert(
        "Vui lòng chọn học kỳ trong Cài đặt trước khi tạo đăng ký dạy học."
      );
    const trId = genId("tr");
    const trPayload = {
      id: trId,
      teacherId: form.teacherId,
      semester,
      maxCourses: Math.max(1, Number(form.maxCourses || 1)),
      status: "PENDING",
    };

    try {
      await teachingRegistrationAPI.create(trPayload);

      const timeCreates = [];
      for (const dayKey of Object.keys(timeGrid)) {
        for (const periodId of Object.keys(timeGrid[dayKey])) {
          const val = Number(timeGrid[dayKey][periodId] || 0);
          if (val > 0) {
            const tp = {
              id: genId("tp"),
              teacherId: form.teacherId,
              semester,
              period: periodId,
              day: dayKey,
              teachingRegistrationId: trId,
              preferenceValue: val,
            };
            timeCreates.push(timePreferenceAPI.create(tp));
          }
        }
      }

      const courseCreates = Object.entries(coursePrefs).map(([courseId, v]) => {
        const cp = {
          id: genId("cp"),
          semester,
          teacherId: form.teacherId,
          teachingRegistrationId: trId,
          courseId,
          preferenceValue: Number(v || 0),
        };
        return coursePreferenceAPI.create(cp);
      });

      const allCreates = [...timeCreates, ...courseCreates];
      if (allCreates.length > 0) {
        await Promise.all(allCreates);
      }

      alert("Tạo đăng ký dạy học thành công");
      setShowCreate(false);
      loadAll();
    } catch (err) {
      console.error("Error creating teaching registration:", err);
      alert("Tạo thất bại: " + err.message);
    }
  };

  const registrations = (allRegistrations || []).filter((r) => r.status === activeTab);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2>Đăng ký dạy học</h2>
        <button className={styles.btnAdd} onClick={startCreate}>
          ➕ Tạo đăng ký
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "PENDING" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("PENDING")}
        >
          Đang chờ ({allRegistrations.filter((r) => r.status === "PENDING").length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "APPROVED" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("APPROVED")}
        >
          Đã duyệt ({allRegistrations.filter((r) => r.status === "APPROVED").length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "REJECTED" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("REJECTED")}
        >
          Đã từ chối ({allRegistrations.filter((r) => r.status === "REJECTED").length})
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : registrations.length === 0 ? (
        <div className={styles.empty}>Chưa có đăng ký nào</div>
      ) : (
        <div className={styles.cardGrid}>
          {registrations.map((r) => {
            const teacher = allTeachers.find((t) => t.id === r.teacherId) || {};
            return (
              <div key={r.id} className={styles.card}>
                <div
                  className={styles.cardHeader}
                  onClick={() => openDetail(r.id)}
                >
                  <div className={styles.teacherInfo}>
                    <div className={styles.avatarContainer}>
                      {teacher.avatar ? (
                        <img src={teacher.avatar} alt={teacher.name} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {teacher.name ? teacher.name.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                    </div>
                    <div className={styles.teacherDetails}>
                      <h3>{teacher.name || r.teacherId}</h3>
                      <div className={styles.metaLine}>
                        {r.maxCourses} môn - {r.status}
                      </div>
                    </div>
                  </div>
                  <div className={styles.expandHint}>
                    {expandedId === r.id ? "▲" : "▼"}
                  </div>
                </div>
                {expandedId === r.id && (
                  <div className={styles.cardBody}>
                    <h4>Chi tiết</h4>
                    <div>
                      <strong>Thời gian ưa thích:</strong>
                      {detail.timePrefs.length === 0 ? (
                        <div className={styles.smallNote}>Chưa có</div>
                      ) : (
                        <div className={styles.smallNote}>
                          {detail.timePrefs.slice(0, 8).map((t) => (
                            <div key={t.id}>
                              {t.day} - {t.period}: {t.preferenceValue}
                            </div>
                          ))}
                          {detail.timePrefs.length > 8 && (
                            <div>
                              ... và {detail.timePrefs.length - 8} mục khác
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <strong>Môn học ưa thích:</strong>
                      {detail.coursePrefs.length === 0 ? (
                        <div className={styles.smallNote}>Chưa có</div>
                      ) : (
                        <ul>
                          {detail.coursePrefs.map((c) => {
                            const course =
                              courses.find((cc) => cc.id === c.courseId) || {};
                            return (
                              <li key={c.id}>
                                {course.name || c.courseId} —{" "}
                                {c.preferenceValue}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <div className={styles.actionButtons}>
                      {r.status === "PENDING" && (
                        <>
                          <button
                            className={styles.btnApprove}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(r.id);
                            }}
                          >
                            ✓ Duyệt
                          </button>
                          <button
                            className={styles.btnReject}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(r.id);
                            }}
                          >
                            ✕ Từ chối
                          </button>
                        </>
                      )}
                      <button
                        className={styles.btnDelete}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className={styles.modal} onClick={() => setShowCreate(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Tạo đăng ký dạy học</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowCreate(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {step === 1 && (
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Chọn giảng viên</h3>
                  <div className={styles.formGroup}>
                    <label>Giảng viên *</label>
                    <select
                      value={form.teacherId}
                      onChange={(e) =>
                        setForm({ ...form, teacherId: e.target.value })
                      }
                      className={styles.teacherSelect}
                    >
                      <option value="">-- Chọn giảng viên --</option>
                      {availableTeachers.length === 0 ? (
                        <option value="" disabled>
                          Không có giảng viên nào khả dụng
                        </option>
                      ) : (
                        availableTeachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))
                      )}
                    </select>
                    {form.teacherId && (() => {
                      const selectedTeacher = availableTeachers.find(t => t.id === form.teacherId);
                      return selectedTeacher && (
                        <div className={styles.selectedTeacherPreview}>
                          {selectedTeacher.avatar ? (
                            <img src={selectedTeacher.avatar} alt={selectedTeacher.name} className={styles.previewAvatar} />
                          ) : (
                            <div className={styles.previewAvatarPlaceholder}>
                              {selectedTeacher.name ? selectedTeacher.name.charAt(0).toUpperCase() : "?"}
                            </div>
                          )}
                          <span>{selectedTeacher.name}</span>
                        </div>
                      );
                    })()}
                    {availableTeachers.length === 0 && (
                      <div className={styles.smallNote}>
                        Tất cả giảng viên đã có đăng ký cho học kỳ này
                      </div>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Số học phần tối đa *</label>
                    <input
                      type="number"
                      min="1"
                      value={form.maxCourses}
                      onChange={(e) =>
                        setForm({ ...form, maxCourses: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Thời gian ưa thích</h3>
                  <p className={styles.stepDesc}>
                    Nhập giá trị ưa thích cho từng ô (càng cao = càng ưa thích)
                  </p>
                  <div className={styles.timeGridContainer}>
                    <div className={styles.timeGrid}>
                      <div className={styles.gridHeader}>
                        <div className={styles.gridCorner}></div>
                        {PERIODS.map((p) => (
                          <div key={p.id} className={styles.gridCellHead}>
                            {p.name}
                          </div>
                        ))}
                      </div>
                      {DAYS.map((d) => (
                        <div key={d.key} className={styles.gridRow}>
                          <div className={styles.gridCellHead}>{d.label}</div>
                          {PERIODS.map((p) => (
                            <div key={p.id} className={styles.gridCell}>
                              <input
                                type="number"
                                min="0"
                                value={
                                  (timeGrid[d.key] && timeGrid[d.key][p.id]) ||
                                  0
                                }
                                onChange={(e) =>
                                  updateGridValue(d.key, p.id, e.target.value)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Môn học ưa thích</h3>
                  <p className={styles.stepDesc}>
                    Chọn các môn học và đặt mức ưu tiên
                  </p>
                  <div className={styles.courseListContainer}>
                    {courses.map((c) => (
                      <div key={c.id} className={styles.courseRow}>
                        <label className={styles.courseLabel}>
                          <input
                            type="checkbox"
                            checked={coursePrefs[c.id] !== undefined}
                            onChange={() => toggleCourseSelect(c.id)}
                          />
                          <span className={styles.courseName}>{c.name}</span>
                        </label>
                        {coursePrefs[c.id] !== undefined && (
                          <input
                            type="number"
                            min="0"
                            value={coursePrefs[c.id]}
                            onChange={(e) =>
                              setCoursePrefValue(c.id, e.target.value)
                            }
                            className={styles.priorityInput}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Xem trước & Xác nhận</h3>
                  <div className={styles.previewBox}>
                    <div className={styles.previewItem}>
                      <span className={styles.previewLabel}>Giảng viên:</span>
                      <span className={styles.previewValue}>
                        {availableTeachers.find((t) => t.id === form.teacherId)?.name ||
                          form.teacherId}
                      </span>
                    </div>
                    <div className={styles.previewItem}>
                      <span className={styles.previewLabel}>
                        Số học phần tối đa:
                      </span>
                      <span className={styles.previewValue}>
                        {form.maxCourses}
                      </span>
                    </div>
                  </div>

                  <div className={styles.previewSection}>
                    <h4>Thời gian ưa thích</h4>
                    {Object.entries(timeGrid).flatMap(([day, row]) =>
                      Object.entries(row)
                        .filter(([, v]) => Number(v) > 0)
                        .map(([period, v]) => `${day} - ${period}: ${v}`)
                    ).length === 0 ? (
                      <p className={styles.emptyText}>Chưa chọn thời gian</p>
                    ) : (
                      <div className={styles.previewList}>
                        {Object.entries(timeGrid).flatMap(([day, row]) =>
                          Object.entries(row)
                            .filter(([, v]) => Number(v) > 0)
                            .map(([period, v]) => (
                              <div
                                key={`${day}-${period}`}
                                className={styles.previewTag}
                              >
                                {day} - {period}: {v}
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.previewSection}>
                    <h4>Môn học ưa thích</h4>
                    {Object.keys(coursePrefs).length === 0 ? (
                      <p className={styles.emptyText}>Chưa chọn môn học</p>
                    ) : (
                      <div className={styles.previewList}>
                        {Object.entries(coursePrefs).map(([cid, v]) => (
                          <div key={cid} className={styles.previewTag}>
                            {courses.find((x) => x.id === cid)?.name || cid} —
                            Ưu tiên: {v}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              {step > 1 && (
                <button
                  className={styles.btnCancel}
                  onClick={() => setStep(step - 1)}
                >
                  ← Quay lại
                </button>
              )}
              {step < 4 && (
                <button
                  className={styles.btnSubmit}
                  onClick={() => {
                    if (step === 1 && !form.teacherId)
                      return alert("Vui lòng chọn giảng viên");
                    setStep(step + 1);
                    if (step === 1) initGrid();
                  }}
                >
                  Tiếp →
                </button>
              )}
              {step === 4 && (
                <button
                  className={styles.btnSubmit}
                  onClick={handleConfirmCreate}
                >
                  ✓ Xác nhận & Tạo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachingRegistration;
