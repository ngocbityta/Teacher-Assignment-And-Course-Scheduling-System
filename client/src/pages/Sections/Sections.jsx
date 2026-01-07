import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from "./Sections.module.css";
import { sectionAPI } from "../../api/section";
import { coursesAPI } from "../../api/courses";
import { getSelectedSemester } from "../../api/index";

const Tabs = { LIST: "list", STATS: "stats" };

const Sections = () => {
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(Tabs.LIST);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", courseId: "", periodRequired: "", requiredSeats: "" });

  const load = async () => {
    setLoading(true);
    try {
      // Use listAll to fetch all sections and courses (not just first page) for proper lookup
      const [{ items: sectionItems }, { items: courseItems }] = await Promise.all([
        sectionAPI.listAll(),
        coursesAPI.listAll(),
      ]);
      setSections(sectionItems || []);
      setCourses(courseItems || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenForm = () => {
    setEditingId(null);
    setForm({ id: "", name: "", courseId: "", periodRequired: "", requiredSeats: "" });
    setShowFormModal(true);
  };

  const handleEdit = (section) => {
    setEditingId(section.id);
    setForm({
      id: section.id,
      name: section.name,
      courseId: section.courseId,
      periodRequired: section.periodRequired || "",
      requiredSeats: section.requiredSeats || "",
    });
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id || !form.name || !form.courseId || form.periodRequired === "" || form.requiredSeats === "") {
      toast.warning("Vui lòng điền đủ thông tin");
      return;
    }
    try {
      if (editingId) {
        await sectionAPI.update(editingId, form);
      } else {
        const sem = getSelectedSemester();
        const payload = sem ? { ...form, semester: sem } : form;
        await sectionAPI.create(payload);
      }
      toast.success(editingId ? "Cập nhật học phần thành công" : "Thêm học phần thành công");
      setShowFormModal(false);
      setForm({ id: "", name: "", courseId: "", periodRequired: "", requiredSeats: "" });
      load();
    } catch (err) {
      console.error(err);
      toast.error((editingId ? "Cập nhật" : "Tạo") + " thất bại: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa học phần này?")) return;
    try {
      await sectionAPI.remove(id);
      toast.success("Xóa học phần thành công");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại: " + err.message);
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
              Thêm học phần
            </button>
          </div>

          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : sections.length === 0 ? (
            <div className={styles.empty}>Chưa có học phần nào</div>
          ) : (
            <div className={styles.courseGroupsContainer}>
              {courseGroups.map((group) => (
                <div key={group.courseId} className={styles.courseBox}>
                  <div className={styles.courseBoxHeader}>
                    <h3 className={styles.courseName}>{group.courseName}</h3>
                    <span className={styles.courseCount}>{group.items.length} học phần</span>
                  </div>
                  <div className={styles.sectionsList}>
                    {group.items.map((section) => (
                      <div
                        key={section.id}
                        className={styles.sectionItem}
                        onClick={() => setSelectedSection(section)}
                      >
                        <div className={styles.sectionItemContent}>
                          <div className={styles.sectionInfo}>
                            <h4 className={styles.sectionName}>{section.name}</h4>
                            <div className={styles.sectionMeta}>
                              <span className={styles.metaItem}>{section.periodRequired} tiết</span>
                              <span className={styles.metaDivider}>•</span>
                              <span className={styles.metaItem}>{section.requiredSeats} chỗ</span>
                            </div>
                          </div>
                          <div className={styles.sectionId}>{section.id}</div>
                        </div>
                      </div>
                    ))}
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
            <div className={styles.statIcon}></div>
            <div className={styles.statContent}>
              <h3>Tổng học phần</h3>
              <p className={styles.statNumber}>{stats.total}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}></div>
            <div className={styles.statContent}>
              <h3>Tiết học trung bình</h3>
              <p className={styles.statNumber}>{stats.avgPeriods}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}></div>
            <div className={styles.statContent}>
              <h3>Tổng tiết học cần</h3>
              <p className={styles.statNumber}>{stats.totalPeriods}</p>
            </div>
          </div>
        </div>
      )}

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
                ×
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
                <div className={styles.formGroup}>
                  <label>Số chỗ ngồi cần</label>
                  <input
                    type="number"
                    min="0"
                    value={form.requiredSeats}
                    onChange={(e) => setForm({ ...form, requiredSeats: e.target.value })}
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

      {selectedSection && (
        <div className={styles.modal} onClick={() => setSelectedSection(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedSection.name}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedSection(null)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", fontWeight: 600, width: "200px", color: "#4a5568" }}>Mã học phần:</td>
                    <td style={{ padding: "12px" }}>{selectedSection.id}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", fontWeight: 600, color: "#4a5568" }}>Tên học phần:</td>
                    <td style={{ padding: "12px" }}>{selectedSection.name}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", fontWeight: 600, color: "#4a5568" }}>Môn học:</td>
                    <td style={{ padding: "12px" }}>{getCourseName(selectedSection.courseId)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", fontWeight: 600, color: "#4a5568" }}>Số tiết học cần:</td>
                    <td style={{ padding: "12px" }}>{selectedSection.periodRequired} tiết</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", fontWeight: 600, color: "#4a5568" }}>Số chỗ ngồi cần:</td>
                    <td style={{ padding: "12px" }}>{selectedSection.requiredSeats} chỗ</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnEdit}
                onClick={() => {
                  handleEdit(selectedSection);
                  setSelectedSection(null);
                }}
              >
                Sửa
              </button>
              <button
                className={styles.btnDelete}
                onClick={() => {
                  handleDelete(selectedSection.id);
                  setSelectedSection(null);
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sections;
