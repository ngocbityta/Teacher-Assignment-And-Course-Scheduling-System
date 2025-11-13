import React, { useEffect, useMemo, useState } from "react";
import styles from "./Teachers.module.css";
import { teachersAPI } from "../../api/teachers";

const Tabs = { LIST: "list", STATS: "stats" };

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(Tabs.LIST);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", status: "active" });

  // detail view state
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await teachersAPI.list();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Failed to load teachers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddClick = () => {
    setEditing(null);
    setForm({ id: "", name: "", status: "active" });
    setShowForm(true);
  };

  const handleEditClick = (teacher) => {
    setEditing(teacher.id || teacher._id);
    setForm({ id: teacher.id || teacher._id || "", name: teacher.name || "", status: teacher.status || "active" });
    setShowForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (!confirm("Xóa giảng viên này?")) return;
    try {
      await teachersAPI.remove(id);
      load();
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại: " + err.message);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await teachersAPI.update(editing, form);
      } else {
        if (!form.id || !form.name) return alert("Vui lòng nhập mã và tên giảng viên.");
        await teachersAPI.create(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ id: "", name: "", status: "active" });
      load();
    } catch (err) {
      console.error(err);
      alert("Lưu thất bại: " + err.message);
    }
  };

  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter((t) => t.status === "active" || !t.status).length;
    const inactive = teachers.filter((t) => t.status === "inactive").length;
    const onLeave = teachers.filter((t) => t.status === "on_leave").length;
    return { total, active, inactive, onLeave };
  }, [teachers]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return styles.statusActive;
      case "inactive":
        return styles.statusInactive;
      case "on_leave":
        return styles.statusOnLeave;
      default:
        return styles.statusActive;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Đang hoạt động";
      case "inactive":
        return "Không hoạt động";
      case "on_leave":
        return "Tạm nghỉ";
      default:
        return "Đang hoạt động";
    }
  };

  return (
    <div className={styles.container}>
      <h2>Giảng viên</h2>

      <div className={styles.tabButtons}>
        <button onClick={() => setActive(Tabs.LIST)} disabled={active === Tabs.LIST}>
          Danh sách
        </button>
        <button onClick={() => setActive(Tabs.STATS)} disabled={active === Tabs.STATS}>
          Thống kê
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        {active === Tabs.LIST && (
          <div>
            <div className={styles.actionButtons}>
              <button onClick={handleAddClick} className={styles.btnAdd}>
                ➕ Thêm giảng viên
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}>Đang tải...</div>
            ) : teachers.length === 0 ? (
              <div className={styles.empty}>Không có giảng viên nào</div>
            ) : (
              <div className={styles.cardGrid}>
                {teachers.map((t) => {
                  const id = t.id || t._id;
                  return (
                    <div
                      key={id}
                      className={styles.card}
                      onClick={() => setSelectedTeacher(t)}
                    >
                      <div className={styles.cardHeader}>
                        <h3>{t.name}</h3>
                        <span className={`${styles.statusBadge} ${getStatusColor(t.status)}`}>
                          {getStatusLabel(t.status)}
                        </span>
                      </div>
                      <div className={styles.cardBody}>
                        <p><strong>Mã:</strong> {id}</p>
                      </div>
                      <div className={styles.cardFooter}>
                        <button
                          className={styles.btnEdit}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(t);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className={styles.btnDelete}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(id);
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detail Modal */}
            {selectedTeacher && (
              <div className={styles.modal} onClick={() => setSelectedTeacher(null)}>
                  <div className={`${styles.modalContent} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h2>{selectedTeacher.name}</h2>
                    <button className={styles.closeBtn} onClick={() => setSelectedTeacher(null)}>
                      ✕
                    </button>
                  </div>
                  <div className={styles.modalBody}>
                    <div className={styles.infoRow}>
                      <label>Mã giảng viên:</label>
                      <span>{selectedTeacher.id || selectedTeacher._id}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <label>Tên:</label>
                      <span>{selectedTeacher.name}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <label>Trạng thái:</label>
                      <span className={`${styles.statusBadge} ${getStatusColor(selectedTeacher.status)}`}>
                        {getStatusLabel(selectedTeacher.status)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.modalFooter}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => {
                        handleEditClick(selectedTeacher);
                        setSelectedTeacher(null);
                      }}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => {
                        handleDeleteClick(selectedTeacher.id || selectedTeacher._id);
                        setSelectedTeacher(null);
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add/Edit Form Modal */}
            {showForm && (
              <div className={styles.modal} onClick={() => setShowForm(false)}>
                  <div className={`${styles.modalContent} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h2>{editing ? "Chỉnh sửa giảng viên" : "Thêm giảng viên mới"}</h2>
                    <button className={styles.closeBtn} onClick={() => setShowForm(false)}>
                      ✕
                    </button>
                  </div>
                  <form onSubmit={submitForm}>
                    <div className={styles.formGroup}>
                      <label>Mã giảng viên *</label>
                      {editing ? (
                        <input
                          type="text"
                          value={form.id}
                          disabled
                          className={styles.inputDisabled}
                        />
                      ) : (
                        <input
                          type="text"
                          value={form.id}
                          onChange={(e) => setForm({ ...form, id: e.target.value })}
                          placeholder="Nhập mã giảng viên"
                          required
                        />
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Tên *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Nhập tên giảng viên"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Trạng thái</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                        <option value="on_leave">Tạm nghỉ</option>
                      </select>
                    </div>
                    <div className={styles.formButtons}>
                      <button type="submit" className={styles.btnSubmit}>
                        {editing ? "Cập nhật" : "Tạo mới"}
                      </button>
                      <button type="button" className={styles.btnCancel} onClick={() => setShowForm(false)}>
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {active === Tabs.STATS && (
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statContent}>
                <h3>Tổng cộng</h3>
                <p className={styles.statNumber}>{stats.total}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statContent}>
                <h3>Đang hoạt động</h3>
                <p className={styles.statNumber}>{stats.active}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>⛔</div>
              <div className={styles.statContent}>
                <h3>Không hoạt động</h3>
                <p className={styles.statNumber}>{stats.inactive}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏖️</div>
              <div className={styles.statContent}>
                <h3>Tạm nghỉ</h3>
                <p className={styles.statNumber}>{stats.onLeave}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teachers;
