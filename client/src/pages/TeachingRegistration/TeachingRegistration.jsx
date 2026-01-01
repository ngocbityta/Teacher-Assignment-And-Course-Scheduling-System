import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
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

  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [detail, setDetail] = useState({ reg: null, timePrefs: [], coursePrefs: [] });

  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    teacherId: "",
    semester: "",
    maxCourses: "",
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
      toast.error("Lỗi khi tải dữ liệu: " + err.message);
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
      toast.warning("Vui lòng chọn học kỳ trong Cài đặt trước khi tạo đăng ký dạy học.");
      return;
    }
    try {
      const available = await teachersAPI.getAvailableForRegistration(semester);
      setAvailableTeachers(available || []);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải danh sách giảng viên: " + err.message);
    }
  };

  const openDetail = async (registration) => {
    if (!registration || !registration.id) return;
    setSelectedRegistration(registration);
    try {
      const [reg, allTime, allCourse] = await Promise.all([
        teachingRegistrationAPI.get(registration.id),
        timePreferenceAPI.list(),
        coursePreferenceAPI.list(),
      ]);
      const timePrefs = (allTime || []).filter((t) => t.teachingRegistrationId === registration.id);
      const coursePrefs = (allCourse || []).filter(
        (c) => c.teachingRegistrationId === registration.id
      );
      setDetail({ reg: reg || registration, timePrefs, coursePrefs });
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải chi tiết đăng ký: " + err.message);
    }
  };

  const initGrid = () => {
    const p = PERIODS || [];
    const grid = {};
    for (const d of DAYS) {
      grid[d.key] = {};
      for (const per of p) grid[d.key][per.id] = "";
    }
    setTimeGrid(grid);
  };

  const startCreate = async () => {
    setForm({ teacherId: "", maxCourses: "" });
    initGrid();
    setCoursePrefs({});
    setStep(1);
    setShowCreate(true);
    await loadAvailableTeachers();
  };

  const updateGridValue = (dayKey, periodId, value) => {
    setTimeGrid((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [periodId]: value === "" ? "" : value },
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
    setCoursePrefs((prev) => ({ ...prev, [courseId]: v === "" ? "" : v }));

  const handleApprove = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn duyệt đăng ký này?")) return;
    try {
      await teachingRegistrationAPI.approve(id);
      toast.success("Đã duyệt đăng ký thành công");
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi duyệt đăng ký: " + err.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn từ chối đăng ký này?")) return;
    try {
      await teachingRegistrationAPI.reject(id);
      toast.success("Đã từ chối đăng ký thành công");
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi từ chối đăng ký: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đăng ký này? Hành động này không thể hoàn tác.")) return;
    try {
      await teachingRegistrationAPI.remove(id);
      toast.success("Đã xóa đăng ký thành công");
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xóa đăng ký: " + err.message);
    }
  };

  const handleConfirmCreate = async () => {
    if (!form.teacherId) {
      toast.warning("Vui lòng chọn giảng viên");
      return;
    }
    const maxCoursesNum = Number(form.maxCourses || 0);
    if (maxCoursesNum < 1) {
      toast.warning("Số học phần tối đa phải >= 1");
      return;
    }
    const semester = getSelectedSemester();
    if (!semester) {
      toast.warning("Vui lòng chọn học kỳ trong Cài đặt trước khi tạo đăng ký dạy học.");
      return;
    }
    const trId = genId("tr");
    const trPayload = {
      id: trId,
      teacherId: form.teacherId,
      semester,
      maxCourses: Math.max(1, maxCoursesNum),
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
              periodId: periodId,
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

      toast.success("Tạo đăng ký dạy học thành công");
      setShowCreate(false);
      loadAll();
    } catch (err) {
      console.error("Error creating teaching registration:", err);
      toast.error("Tạo thất bại: " + err.message);
    }
  };

  const registrations = (allRegistrations || []).filter((r) => r.status === activeTab);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2>Đăng ký dạy học</h2>
        <button className={styles.btnAdd} onClick={startCreate}>
          Tạo đăng ký
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
                  onClick={() => openDetail(r)}
                  style={{ cursor: "pointer" }}
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
                </div>
                {r.status === "PENDING" && (
                  <div className={styles.cardFooter}>
                    <button
                      className={styles.btnApprove}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(r.id);
                      }}
                    >
                      Duyệt
                    </button>
                    <button
                      className={styles.btnReject}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(r.id);
                      }}
                    >
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedRegistration && (
        <div className={styles.modal} onClick={() => setSelectedRegistration(null)}>
          <div className={styles.modalContent} style={{ maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết đăng ký dạy học</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedRegistration(null)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {(() => {
                const teacher = allTeachers.find((t) => t.id === selectedRegistration.teacherId) || {};
                const reg = detail.reg || selectedRegistration;

                const timeTable = {};
                DAYS.forEach(day => {
                  timeTable[day.key] = {};
                  PERIODS.forEach(period => {
                    const pref = detail.timePrefs.find(tp => tp.day === day.key && tp.periodId === period.id);
                    timeTable[day.key][period.id] = pref ? pref.preferenceValue : null;
                  });
                });

                return (
                  <>
                    <div style={{ marginBottom: "24px" }}>
                      <h3 style={{ marginBottom: "16px", color: "#1a202c" }}>Thông tin cơ bản</h3>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ padding: "12px", fontWeight: 600, width: "200px", color: "#4a5568" }}>Giảng viên:</td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                {teacher.avatar ? (
                                  <img src={teacher.avatar} alt={teacher.name} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                                ) : (
                                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                                    {teacher.name ? teacher.name.charAt(0).toUpperCase() : "?"}
                                  </div>
                                )}
                                <span>{teacher.name || selectedRegistration.teacherId}</span>
                              </div>
                            </td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ padding: "12px", fontWeight: 600, color: "#4a5568" }}>Số học phần tối đa:</td>
                            <td style={{ padding: "12px" }}>{reg.maxCourses || selectedRegistration.maxCourses}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ padding: "12px", fontWeight: 600, color: "#4a5568" }}>Học kỳ:</td>
                            <td style={{ padding: "12px" }}>{reg.semester || selectedRegistration.semester || "N/A"}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ padding: "12px", fontWeight: 600, color: "#4a5568" }}>Trạng thái:</td>
                            <td style={{ padding: "12px" }}>
                              <span style={{
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                background: reg.status === "APPROVED" ? "#c6f6d5" : reg.status === "REJECTED" ? "#fed7d7" : "#feebc8",
                                color: reg.status === "APPROVED" ? "#22543d" : reg.status === "REJECTED" ? "#742a2a" : "#7c2d12"
                              }}>
                                {reg.status === "APPROVED" ? "Đã duyệt" : reg.status === "REJECTED" ? "Đã từ chối" : "Đang chờ"}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                      <h3 style={{ marginBottom: "16px", color: "#1a202c" }}>Thời gian ưa thích</h3>
                      {detail.timePrefs.length === 0 ? (
                        <p style={{ color: "#718096", textAlign: "center", padding: "20px" }}>Chưa có thời gian ưa thích</p>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0" }}>
                            <thead>
                              <tr style={{ background: "#f7fafc" }}>
                                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e2e8f0", fontWeight: 600 }}>Ca / Thứ</th>
                                {DAYS.map(day => (
                                  <th key={day.key} style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", fontWeight: 600 }}>
                                    {day.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {PERIODS.map(period => (
                                <tr key={period.id}>
                                  <td style={{ padding: "12px", border: "1px solid #e2e8f0", fontWeight: 500, background: "#f7fafc" }}>
                                    {period.name}
                                  </td>
                                  {DAYS.map(day => {
                                    const value = timeTable[day.key][period.id];
                                    return (
                                      <td key={day.key} style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                                        {value !== null ? (
                                          <span style={{
                                            display: "inline-block",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            background: value > 0 ? "#bee3f8" : "#e2e8f0",
                                            color: value > 0 ? "#2c5282" : "#718096",
                                            fontWeight: 500,
                                            minWidth: "30px"
                                          }}>
                                            {value}
                                          </span>
                                        ) : (
                                          <span style={{ color: "#cbd5e0" }}>-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                      <h3 style={{ marginBottom: "16px", color: "#1a202c" }}>Môn học ưa thích</h3>
                      {detail.coursePrefs.length === 0 ? (
                        <p style={{ color: "#718096", textAlign: "center", padding: "20px" }}>Chưa có môn học ưa thích</p>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0" }}>
                            <thead>
                              <tr style={{ background: "#f7fafc" }}>
                                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e2e8f0", fontWeight: 600 }}>STT</th>
                                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e2e8f0", fontWeight: 600 }}>Mã môn học</th>
                                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #e2e8f0", fontWeight: 600 }}>Tên môn học</th>
                                <th style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0", fontWeight: 600 }}>Mức ưu tiên</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.coursePrefs.map((c, index) => {
                                const course = courses.find((cc) => cc.id === c.courseId) || {};
                                return (
                                  <tr key={c.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                    <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>{index + 1}</td>
                                    <td style={{ padding: "12px", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>{c.courseId}</td>
                                    <td style={{ padding: "12px", border: "1px solid #e2e8f0" }}>{course.name || "N/A"}</td>
                                    <td style={{ padding: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                                      <span style={{
                                        display: "inline-block",
                                        padding: "4px 12px",
                                        borderRadius: "12px",
                                        background: c.preferenceValue > 0 ? "#bee3f8" : "#e2e8f0",
                                        color: c.preferenceValue > 0 ? "#2c5282" : "#718096",
                                        fontWeight: 500,
                                        minWidth: "40px"
                                      }}>
                                        {c.preferenceValue}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className={styles.modalFooter}>
              {selectedRegistration.status === "PENDING" && (
                <>
                  <button
                    className={styles.btnApprove}
                    onClick={() => {
                      handleApprove(selectedRegistration.id);
                      setSelectedRegistration(null);
                    }}
                  >
                    Duyệt
                  </button>
                  <button
                    className={styles.btnReject}
                    onClick={() => {
                      handleReject(selectedRegistration.id);
                      setSelectedRegistration(null);
                    }}
                  >
                    Từ chối
                  </button>
                </>
              )}
              <button
                className={styles.btnDelete}
                onClick={() => {
                  handleDelete(selectedRegistration.id);
                  setSelectedRegistration(null);
                }}
              >
                Xóa
              </button>
            </div>
          </div>
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
                ×
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
                      placeholder="Nhập số học phần"
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val === "" || val === "0") {
                          setForm({ ...form, maxCourses: "" });
                        }
                      }}
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
                        <div className={styles.gridCorner}>Ca / Thứ</div>
                        {DAYS.map((d) => (
                          <div key={d.key} className={styles.gridCellHead}>
                            {d.label}
                          </div>
                        ))}
                      </div>
                      {PERIODS.map((p) => (
                        <div key={p.id} className={styles.gridRow}>
                          <div className={styles.gridCellHead}>{p.name}</div>
                          {DAYS.map((d) => (
                            <div key={d.key} className={styles.gridCell}>
                              <input
                                type="number"
                                min="0"
                                value={
                                  (timeGrid[d.key] && timeGrid[d.key][p.id]) !== undefined
                                    ? timeGrid[d.key][p.id]
                                    : ""
                                }
                                onChange={(e) =>
                                  updateGridValue(d.key, p.id, e.target.value)
                                }
                                placeholder="0"
                                onBlur={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || val === "0") {
                                    updateGridValue(d.key, p.id, "");
                                  }
                                }}
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
                            value={coursePrefs[c.id] !== undefined ? coursePrefs[c.id] : ""}
                            onChange={(e) =>
                              setCoursePrefValue(c.id, e.target.value)
                            }
                            className={styles.priorityInput}
                            placeholder="0"
                            onBlur={(e) => {
                              const val = e.target.value;
                              if (val === "" || val === "0") {
                                setCoursePrefValue(c.id, "");
                              }
                            }}
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
                        {form.maxCourses || "Chưa nhập"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.previewSection}>
                    <h4>Thời gian ưa thích</h4>
                    {Object.entries(timeGrid).flatMap(([dayKey, row]) =>
                      Object.entries(row)
                        .filter(([, v]) => Number(v) > 0)
                        .map(([periodId, v]) => `${dayKey} - ${periodId}: ${v}`)
                    ).length === 0 ? (
                      <p className={styles.emptyText}>Chưa chọn thời gian</p>
                    ) : (
                      <div className={styles.previewList}>
                        {Object.entries(timeGrid).flatMap(([dayKey, row]) =>
                          Object.entries(row)
                            .filter(([, v]) => Number(v) > 0)
                            .map(([periodId, v]) => {
                              const dayLabel = DAYS.find(d => d.key === dayKey)?.label || dayKey;
                              const periodLabel = PERIODS.find(p => p.id === periodId)?.name || periodId;
                              return (
                                <div
                                  key={`${dayKey}-${periodId}`}
                                  className={styles.previewTag}
                                >
                                  {dayLabel} - {periodLabel}: {v}
                                </div>
                              );
                            })
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
                    if (step === 1 && !form.teacherId) {
                      toast.warning("Vui lòng chọn giảng viên");
                      return;
                    }
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
                  Xác nhận & Tạo
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
