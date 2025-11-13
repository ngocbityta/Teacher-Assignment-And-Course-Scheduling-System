import React, { useEffect, useState } from "react";
import styles from "./TeachingRegistration.module.css";
import { teachingRegistrationAPI } from "../../api/teachingRegistration";
import { teachersAPI } from "../../api/teachers";
import { coursesAPI } from "../../api/courses";
import { PERIODS } from "../../api/timeSlots";
import { timePreferenceAPI } from "../../api/timePreference";
import { coursePreferenceAPI } from "../../api/coursePreference";

const DAYS = [
  { key: "MONDAY", label: "Thứ 2" },
  { key: "TUESDAY", label: "Thứ 3" },
  { key: "WEDNESDAY", label: "Thứ 4" },
  { key: "THURSDAY", label: "Thứ 5" },
  { key: "FRIDAY", label: "Thứ 6" },
];

function genId(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const TeachingRegistration = () => {
  const [list, setList] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // detail/expand
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState({ timePrefs: [], coursePrefs: [] });

  // create flow
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ teacherId: "", semesterId: "", maxCourses: 1 });
  const [timeGrid, setTimeGrid] = useState({}); // { day: { periodId: value } }
  const [coursePrefs, setCoursePrefs] = useState({}); // { courseId: value }

  const loadAll = async () => {
    setLoading(true);
    try {
      const [regs, tList, cList] = await Promise.all([
        teachingRegistrationAPI.list(),
        teachersAPI.list(),
        coursesAPI.list(),
      ]);
      setList(Array.isArray(regs) ? regs : []);
      setTeachers(Array.isArray(tList) ? tList : []);
      setCourses(Array.isArray(cList.items ? cList.items : cList) ? (cList.items || cList) : []);
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
      const timePrefs = Array.isArray(allTime) ? allTime.filter((t) => t.teachingRegistrationId === id) : [];
      const coursePrefs = Array.isArray(allCourse) ? allCourse.filter((c) => c.teachingRegistrationId === id) : [];
      setDetail({ reg, timePrefs, coursePrefs });
    } catch (err) {
      console.error(err);
    }
  };

  // initialize timeGrid with zeros
  const initGrid = () => {
    const p = PERIODS || [];
    const grid = {};
    for (const d of DAYS) {
      grid[d.key] = {};
      for (const per of p) grid[d.key][per.id] = 0;
    }
    setTimeGrid(grid);
  };

  const startCreate = () => {
    setForm({ teacherId: "", maxCourses: 1 });
    initGrid();
    setCoursePrefs({});
    setStep(1);
    setShowCreate(true);
  };

  const updateGridValue = (dayKey, periodId, value) => {
    setTimeGrid((prev) => ({ ...prev, [dayKey]: { ...prev[dayKey], [periodId]: Number(value || 0) } }));
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

  const setCoursePrefValue = (courseId, v) => setCoursePrefs((prev) => ({ ...prev, [courseId]: Number(v || 0) }));

  const handleConfirmCreate = async () => {
    if (!form.teacherId) return alert("Vui lòng chọn giảng viên");
    if (Number(form.maxCourses || 0) < 1) return alert("Số học phần tối đa phải >= 1");
    
    const semesterId = "20252";
    const trId = genId("tr");
    const trPayload = { 
      id: trId, 
      teacherId: form.teacherId, 
      semesterId, 
      maxCourses: Math.max(1, Number(form.maxCourses || 1)), 
      status: "PENDING" 
    };
    
    try {
      console.log("Creating teaching registration:", trPayload);
      await teachingRegistrationAPI.create(trPayload);

      // create time preferences (only non-zero values)
      const timeCreates = [];
      for (const dayKey of Object.keys(timeGrid)) {
        for (const periodId of Object.keys(timeGrid[dayKey])) {
          const val = Number(timeGrid[dayKey][periodId] || 0);
          if (val > 0) {
            const tp = {
              id: genId("tp"),
              teacherId: form.teacherId,
              semesterId,
              period: periodId,
              day: dayKey,
              teachingRegistrationId: trId,
              preferenceValue: val,
            };
            timeCreates.push(timePreferenceAPI.create(tp));
          }
        }
      }

      // create course preferences (only selected courses)
      const courseCreates = Object.entries(coursePrefs).map(([courseId, v]) => {
        const cp = {
          id: genId("cp"),
          semesterId,
          teacherId: form.teacherId,
          teachingRegistrationId: trId,
          courseId,
          preferenceValue: Number(v || 0),
        };
        return coursePreferenceAPI.create(cp);
      });

      const allCreates = [...timeCreates, ...courseCreates];
      if (allCreates.length > 0) {
        console.log("Creating preferences, count:", allCreates.length);
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

  const registrations = list || [];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2>Đăng ký dạy học</h2>
        <button className={styles.btnAdd} onClick={startCreate}>➕ Tạo đăng ký</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : registrations.length === 0 ? (
        <div className={styles.empty}>Chưa có đăng ký nào</div>
      ) : (
        <div className={styles.cardGrid}>
          {registrations.map((r) => {
            const teacher = teachers.find((t) => t.id === r.teacherId) || {};
            return (
              <div key={r.id} className={styles.card}>
                <div className={styles.cardHeader} onClick={() => openDetail(r.id)}>
                  <div>
                    <h3>{teacher.name || r.teacherId}</h3>
                    <div className={styles.metaLine}>{r.maxCourses} môn - {r.status}</div>
                  </div>
                  <div className={styles.expandHint}>{expandedId === r.id ? "▲" : "▼"}</div>
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
                            <div key={t.id}>{t.day} - {t.period}: {t.preferenceValue}</div>
                          ))}
                          {detail.timePrefs.length > 8 && <div>... và {detail.timePrefs.length - 8} mục khác</div>}
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
                            const course = courses.find((cc) => cc.id === c.courseId) || {};
                            return <li key={c.id}>{course.name || c.courseId} — {c.preferenceValue}</li>;
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className={styles.modal} onClick={() => setShowCreate(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Tạo đăng ký dạy học</h2>
              <button className={styles.closeBtn} onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {step === 1 && (
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Chọn giảng viên</h3>
                  <div className={styles.formGroup}>
                    <label>Giảng viên *</label>
                    <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
                      <option value="">-- Chọn giảng viên --</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Số học phần tối đa *</label>
                    <input type="number" min="1" value={form.maxCourses} onChange={(e) => setForm({ ...form, maxCourses: e.target.value })} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Thời gian ưa thích</h3>
                  <p className={styles.stepDesc}>Nhập giá trị ưa thích cho từng ô (càng cao = càng ưa thích)</p>
                  <div className={styles.timeGridContainer}>
                    <div className={styles.timeGrid}>
                      <div className={styles.gridHeader}>
                        <div className={styles.gridCorner}></div>
                        {PERIODS.map((p) => <div key={p.id} className={styles.gridCellHead}>{p.name}</div>)}
                      </div>
                      {DAYS.map((d) => (
                        <div key={d.key} className={styles.gridRow}>
                          <div className={styles.gridCellHead}>{d.label}</div>
                          {PERIODS.map((p) => (
                            <div key={p.id} className={styles.gridCell}>
                              <input type="number" min="0" value={(timeGrid[d.key] && timeGrid[d.key][p.id]) || 0} onChange={(e) => updateGridValue(d.key, p.id, e.target.value)} />
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
                  <p className={styles.stepDesc}>Chọn các môn học và đặt mức ưu tiên</p>
                  <div className={styles.courseListContainer}>
                    {courses.map((c) => (
                      <div key={c.id} className={styles.courseRow}>
                        <label className={styles.courseLabel}>
                          <input type="checkbox" checked={coursePrefs[c.id] !== undefined} onChange={() => toggleCourseSelect(c.id)} />
                          <span className={styles.courseName}>{c.name}</span>
                        </label>
                        {coursePrefs[c.id] !== undefined && (
                          <input type="number" min="0" value={coursePrefs[c.id]} onChange={(e) => setCoursePrefValue(c.id, e.target.value)} className={styles.priorityInput} />
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
                      <span className={styles.previewValue}>{teachers.find((t) => t.id === form.teacherId)?.name || form.teacherId}</span>
                    </div>
                    <div className={styles.previewItem}>
                      <span className={styles.previewLabel}>Số học phần tối đa:</span>
                      <span className={styles.previewValue}>{form.maxCourses}</span>
                    </div>
                  </div>

                  <div className={styles.previewSection}>
                    <h4>Thời gian ưa thích</h4>
                    {Object.entries(timeGrid).flatMap(([day, row]) => Object.entries(row).filter(([,v]) => Number(v) > 0).map(([period, v]) => `${day} - ${period}: ${v}`)).length === 0 ? (
                      <p className={styles.emptyText}>Chưa chọn thời gian</p>
                    ) : (
                      <div className={styles.previewList}>
                        {Object.entries(timeGrid).flatMap(([day, row]) => Object.entries(row).filter(([,v]) => Number(v) > 0).map(([period, v]) => (
                          <div key={`${day}-${period}`} className={styles.previewTag}>{day} - {period}: {v}</div>
                        )))}
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
                          <div key={cid} className={styles.previewTag}>{courses.find((x) => x.id === cid)?.name || cid} — Ưu tiên: {v}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              {step > 1 && <button className={styles.btnCancel} onClick={() => setStep(step - 1)}>← Quay lại</button>}
              {step < 4 && <button className={styles.btnSubmit} onClick={() => { if (step === 1 && !form.teacherId) return alert('Vui lòng chọn giảng viên'); setStep(step + 1); if (step === 1) initGrid(); }}>Tiếp →</button>}
              {step === 4 && <button className={styles.btnSubmit} onClick={handleConfirmCreate}>✓ Xác nhận & Tạo</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachingRegistration;
