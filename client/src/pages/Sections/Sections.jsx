import React, { useEffect, useState } from "react";
import styles from "./Sections.module.css";
import { sectionAPI } from "../../api/section";
import { coursesAPI } from "../../api/courses";

const Tabs = { LIST: "list", STATS: "stats" };

const Sections = () => {
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(Tabs.LIST);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", courseId: "", periodRequired: "" });
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (courseId) => {
    setCollapsedGroups((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const load = async () => {
    setLoading(true);
    try {
      const [sectionsData, coursesData] = await Promise.all([
        sectionAPI.list(),
        coursesAPI.list(),
      ]);
      setSections(Array.isArray(sectionsData.items) ? sectionsData.items : []);
      setCourses(Array.isArray(coursesData.items) ? coursesData.items : []);
    } catch (err) {
      console.error(err);
      alert("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenForm = () => {
    setEditingId(null);
    setForm({ id: "", name: "", courseId: "", periodRequired: "" });
    setShowFormModal(true);
  };

  const handleEdit = (section) => {
    setEditingId(section.id);
    setForm({
      id: section.id,
      name: section.name,
      courseId: section.courseId,
      periodRequired: section.periodRequired || "",
    });
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id || !form.name || !form.courseId || form.periodRequired === "") {
      alert("Vui lòng điền đủ thông tin");
      return;
    }
    try {
      if (editingId) {
        await sectionAPI.update(editingId, form);
      } else {
        await sectionAPI.create(form);
      }
      setShowFormModal(false);
      setForm({ id: "", name: "", courseId: "", periodRequired: "" });
      load();
    } catch (err) {
      console.error(err);
      alert((editingId ? "Cập nhật" : "Tạo") + " thất bại: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xác nhận xóa học phần này?")) return;
    try {
      await sectionAPI.remove(id);
      load();
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + err.message);
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : "N/A";
  };

  const stats = {
    total: sections.length,
    avgPeriods: sections.length > 0 ? Math.round(sections.reduce((sum, s) => sum + (s.periodRequired || 0), 0) / sections.length) : 0,
    totalPeriods: sections.reduce((sum, s) => sum + (s.periodRequired || 0), 0),
  };

  // group sections by courseId
  const grouped = sections.reduce((acc, s) => {
    const key = s.courseId || "_unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const courseGroups = Object.keys(grouped).map((courseId) => ({
    courseId,
    courseName: getCourseName(courseId),
    items: grouped[courseId],
  }));

  return (
    <div className={styles.container}>
      <h2>Quản lý Học phần</h2>
      <p>Tạo, chỉnh sửa, và xóa các học phần. Mỗi học phần thuộc một môn học cụ thể.</p>

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
              ➕ Thêm học phần
            </button>
          </div>

          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : sections.length === 0 ? (
            <div className={styles.empty}>Chưa có học phần nào</div>
          ) : (
            <div className={styles.cardGrid}>
              {courseGroups.map((group) => (
                <div key={group.courseId} className={styles.groupContainer}>
                  <div className={styles.groupHeader}>
                    <div className={styles.groupTitle}>
                      {group.courseName}
                      <span className={styles.groupMeta}> ({group.items.length})</span>
                    </div>
                    <button className={styles.collapseBtn} onClick={() => toggleGroup(group.courseId)}>
                      {collapsedGroups[group.courseId] ? "▸" : "▾"}
                    </button>
                  </div>

                  {!collapsedGroups[group.courseId] && (
                    <div className={styles.groupContent}>
                      {group.items.map((section) => (
                        <div key={section.id} className={styles.card}>
                          <div className={styles.cardHeader}>
                            <h3>{section.name}</h3>
                          </div>
                          <div className={styles.cardBody}>
                            <p>
                              <strong>Mã:</strong> {section.id}
                            </p>
                            <p>
                              <strong>Tiết học cần:</strong> {section.periodRequired}
                            </p>
                          </div>
                          <div className={styles.cardFooter}>
                            <button
                              className={styles.btnEdit}
                              onClick={() => handleEdit(section)}
                            >
                              ✏️
                            </button>
                            <button
                              className={styles.btnDelete}
                              onClick={() => handleDelete(section.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === Tabs.STATS && (
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📖</div>
            <div className={styles.statContent}>
              <h3>Tổng học phần</h3>
              <p className={styles.statNumber}>{stats.total}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏱️</div>
            <div className={styles.statContent}>
              <h3>Tiết học trung bình</h3>
              <p className={styles.statNumber}>{stats.avgPeriods}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statContent}>
              <h3>Tổng tiết học cần</h3>
              <p className={styles.statNumber}>{stats.totalPeriods}</p>
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
              <h2>{editingId ? "Chỉnh sửa học phần" : "Thêm học phần mới"}</h2>
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
                  <label>Mã học phần</label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    disabled={!!editingId}
                    className={editingId ? styles.inputDisabled : ""}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Tên học phần</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Chọn môn học</label>
                  <select
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  >
                    <option value="">-- Chọn môn học --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Số tiết học cần</label>
                  <input
                    type="number"
                    min="0"
                    value={form.periodRequired}
                    onChange={(e) => setForm({ ...form, periodRequired: e.target.value })}
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

export default Sections;
