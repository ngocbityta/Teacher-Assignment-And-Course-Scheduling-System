import React, { useEffect, useState } from "react";
import styles from "./Courses.module.css";
import { coursesAPI } from "../../api/courses";
import { sectionAPI } from "../../api/section";

const Tabs = { LIST: "list", STATS: "stats" };

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(Tabs.LIST);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailCourse, setDetailCourse] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", minTeachers: "", maxTeachers: "" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await coursesAPI.list();
      setCourses(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error(err);
      alert("Failed to load courses: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenDetail = async (course) => {
    setDetailCourse(course);
    try {
      const data = await sectionAPI.list();
      const courseSections = (Array.isArray(data.items) ? data.items : []).filter(
        (s) => s.courseId === course.id
      );
      setSections(courseSections);
    } catch (err) {
      console.error(err);
      setSections([]);
    }
    setShowDetailModal(true);
  };

  const handleEdit = (course) => {
    setEditingId(course.id);
    setForm({
      id: course.id,
      name: course.name,
      minTeachers: course.minTeachers || "",
      maxTeachers: course.maxTeachers || "",
    });
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleOpenForm = () => {
    setEditingId(null);
    setForm({ id: "", name: "", minTeachers: "", maxTeachers: "" });
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id || !form.name || form.minTeachers === "" || form.maxTeachers === "") {
      alert("Please fill in all fields");
      return;
    }
    try {
      if (editingId) {
        await coursesAPI.update(editingId, form);
      } else {
        await coursesAPI.create(form);
      }
      setShowFormModal(false);
      setForm({ id: "", name: "", minTeachers: "", maxTeachers: "" });
      load();
    } catch (err) {
      console.error(err);
      alert((editingId ? "Update" : "Create") + " failed: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xác nhận xóa môn học này?")) return;
    try {
      await coursesAPI.remove(id);
      load();
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + err.message);
    }
  };

  const stats = {
    total: courses.length,
    minAvg: courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + (c.minTeachers || 0), 0) / courses.length) : 0,
    maxAvg: courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + (c.maxTeachers || 0), 0) / courses.length) : 0,
  };

  return (
    <div className={styles.container}>
      <h2>Quản lý Môn học</h2>
      <p>Tạo, chỉnh sửa, và xóa các môn học.</p>

      <div className={styles.tabButtons}>
        <button
          disabled={activeTab === Tabs.LIST}
          onClick={() => setActiveTab(Tabs.LIST)}
        >
          Danh sách
        </button>
        <button
          disabled={activeTab === Tabs.STATS}
          onClick={() => setActiveTab(Tabs.STATS)}
        >
          Thống kê
        </button>
      </div>

      {activeTab === Tabs.LIST && (
        <>
          <div className={styles.actionButtons}>
            <button className={styles.btnAdd} onClick={handleOpenForm}>
              ➕ Thêm môn học
            </button>
          </div>

          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : courses.length === 0 ? (
            <div className={styles.empty}>Chưa có môn học nào</div>
          ) : (
            <div className={styles.cardGrid}>
              {courses.map((course) => (
                <div key={course.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{course.name}</h3>
                  </div>
                  <div className={styles.cardBody}>
                    <p>
                      <strong>Mã:</strong> {course.id}
                    </p>
                    <p>
                      <strong>Giáo viên tối thiểu:</strong> {course.minTeachers}
                    </p>
                    <p>
                      <strong>Giáo viên tối đa:</strong> {course.maxTeachers}
                    </p>
                  </div>
                  <div className={styles.cardFooter}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => handleOpenDetail(course)}
                    >
                      Xem chi tiết
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => handleDelete(course.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === Tabs.STATS && (
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statContent}>
              <h3>Tổng môn học</h3>
              <p className={styles.statNumber}>{stats.total}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <h3>Giáo viên tối thiểu (TB)</h3>
              <p className={styles.statNumber}>{stats.minAvg}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👫</div>
            <div className={styles.statContent}>
              <h3>Giáo viên tối đa (TB)</h3>
              <p className={styles.statNumber}>{stats.maxAvg}</p>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailCourse && (
        <div className={styles.modal} onClick={() => setShowDetailModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>{detailCourse.name}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoRow}>
                <label>Mã môn học:</label>
                <span>{detailCourse.id}</span>
              </div>
              <div className={styles.infoRow}>
                <label>Tên môn học:</label>
                <span>{detailCourse.name}</span>
              </div>
              <div className={styles.infoRow}>
                <label>Giáo viên tối thiểu:</label>
                <span>{detailCourse.minTeachers}</span>
              </div>
              <div className={styles.infoRow}>
                <label>Giáo viên tối đa:</label>
                <span>{detailCourse.maxTeachers}</span>
              </div>

              <h3 style={{ marginTop: 24, marginBottom: 16, color: "#1a202c" }}>
                Học phần thuộc môn học này ({sections.length})
              </h3>
              {sections.length === 0 ? (
                <p style={{ color: "#718096", textAlign: "center", padding: "20px" }}>
                  Chưa có học phần nào
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      style={{
                        padding: "12px",
                        background: "#f7fafc",
                        borderRadius: "8px",
                        borderLeft: "4px solid #3182ce",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#1a202c" }}>
                        {section.name}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#4a5568", marginTop: "4px" }}>
                        Mã: {section.id} | Tiết học cần: {section.periodRequired}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSubmit}
                onClick={() => handleEdit(detailCourse)}
              >
                Chỉnh sửa
              </button>
              <button
                className={styles.btnCancel}
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className={styles.modal} onClick={() => setShowFormModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>{editingId ? "Chỉnh sửa môn học" : "Thêm môn học mới"}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowFormModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Mã môn học</label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    disabled={!!editingId}
                    className={editingId ? styles.inputDisabled : ""}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Tên môn học</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Giáo viên tối thiểu</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minTeachers}
                    onChange={(e) => setForm({ ...form, minTeachers: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Giáo viên tối đa</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxTeachers}
                    onChange={(e) => setForm({ ...form, maxTeachers: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formButtons}>
                <button type="submit" className={styles.btnSubmit}>
                  {editingId ? "Cập nhật" : "Thêm"}
                </button>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowFormModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
