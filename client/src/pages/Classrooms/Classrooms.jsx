import React, { useEffect, useMemo, useState } from "react";
import styles from "./Classrooms.module.css";
import { classroomAPI } from "../../api/classroom";

const Tabs = { LIST: "list", STATS: "stats" };

const Classrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(Tabs.LIST);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", capacity: 30, status: "active" });

  // detail view state
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await classroomAPI.list();
      setClassrooms(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load classrooms: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddClick = () => {
    setEditing(null);
    setForm({ id: "", name: "", capacity: 30, status: "active" });
    setShowForm(true);
  };

  const handleEditClick = (classroom) => {
    setEditing(classroom.id || classroom._id);
    setForm({
      id: classroom.id || classroom._id || "",
      name: classroom.name || "",
      capacity: classroom.capacity || 30,
      status: classroom.status || "active",
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (!confirm("Xóa phòng học này?")) return;
    try {
      await classroomAPI.remove(id);
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
        await classroomAPI.update(editing, form);
      } else {
        if (!form.id || !form.name || !form.capacity) {
          return alert("Vui lòng nhập mã, tên, và sức chứa phòng học.");
        }
        await classroomAPI.create(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ id: "", name: "", capacity: 30, status: "active" });
      load();
    } catch (err) {
      console.error(err);
      alert("Lưu thất bại: " + err.message);
    }
  };

  const stats = useMemo(() => {
    const total = classrooms.length;
    const active = classrooms.filter((c) => c.status === "active" || !c.status).length;
    const inactive = classrooms.filter((c) => c.status === "inactive").length;
    const maintenance = classrooms.filter((c) => c.status === "maintenance").length;
    const totalCapacity = classrooms.reduce((sum, c) => sum + (c.capacity || 0), 0);
    return { total, active, inactive, maintenance, totalCapacity };
  }, [classrooms]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return styles.statusActive;
      case "inactive":
        return styles.statusInactive;
      case "maintenance":
        return styles.statusMaintenance;
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
      case "maintenance":
        return "Bảo trì";
      default:
        return "Đang hoạt động";
    }
  };

  return (
    <div className={styles.container}>
      <h2>Phòng học</h2>

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
                ➕ Thêm phòng học
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}>Đang tải...</div>
            ) : classrooms.length === 0 ? (
              <div className={styles.empty}>Không có phòng học nào</div>
            ) : (
              <div className={styles.cardGrid}>
                {classrooms.map((c) => {
                  const id = c.id || c._id;
                  return (
                    <div
                      key={id}
                      className={styles.card}
                      onClick={() => setSelectedClassroom(c)}
                    >
                      <div className={styles.cardHeader}>
                        <h3>{c.name}</h3>
                        <span className={`${styles.statusBadge} ${getStatusColor(c.status)}`}>
                          {getStatusLabel(c.status)}
                        </span>
                      </div>
                      <div className={styles.cardBody}>
                        <p><strong>Mã:</strong> {id}</p>
                        <p><strong>Sức chứa:</strong> {c.capacity} chỗ</p>
                      </div>
                      <div className={styles.cardFooter}>
                        <button
                          className={styles.btnEdit}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(c);
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
            {selectedClassroom && (
              <div className={styles.modal} onClick={() => setSelectedClassroom(null)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h2>{selectedClassroom.name}</h2>
                    <button className={styles.closeBtn} onClick={() => setSelectedClassroom(null)}>
                      ✕
                    </button>
                  </div>
                  <div className={styles.modalBody}>
                    <div className={styles.infoRow}>
                      <label>Mã phòng:</label>
                      <span>{selectedClassroom.id || selectedClassroom._id}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <label>Tên phòng:</label>
                      <span>{selectedClassroom.name}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <label>Sức chứa:</label>
                      <span>{selectedClassroom.capacity} chỗ</span>
                    </div>
                    <div className={styles.infoRow}>
                      <label>Trạng thái:</label>
                      <span className={`${styles.statusBadge} ${getStatusColor(selectedClassroom.status)}`}>
                        {getStatusLabel(selectedClassroom.status)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.modalFooter}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => {
                        handleEditClick(selectedClassroom);
                        setSelectedClassroom(null);
                      }}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => {
                        handleDeleteClick(selectedClassroom.id || selectedClassroom._id);
                        setSelectedClassroom(null);
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
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h2>{editing ? "Chỉnh sửa phòng học" : "Thêm phòng học mới"}</h2>
                    <button className={styles.closeBtn} onClick={() => setShowForm(false)}>
                      ✕
                    </button>
                  </div>
                  <form onSubmit={submitForm}>
                    <div className={styles.modalBody}>
                      <div className={styles.formGroup}>
                      <label>Mã phòng *</label>
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
                          placeholder="Nhập mã phòng"
                          required
                        />
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Tên phòng *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Nhập tên phòng"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Sức chứa (số chỗ) *</label>
                      <input
                        type="number"
                        value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                        placeholder="Nhập sức chứa phòng"
                        min="1"
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
                        <option value="maintenance">Bảo trì</option>
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
              <div className={styles.statIcon}>🏫</div>
              <div className={styles.statContent}>
                <h3>Tổng phòng</h3>
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
              <div className={styles.statIcon}>🔧</div>
              <div className={styles.statContent}>
                <h3>Bảo trì</h3>
                <p className={styles.statNumber}>{stats.maintenance}</p>
              </div>
            </div>

            <div className={styles.statCard} style={{ gridColumn: "1 / -1" }}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statContent}>
                <h3>Tổng sức chứa</h3>
                <p className={styles.statNumber}>{stats.totalCapacity}</p>
                <p style={{ margin: "8px 0 0 0", color: "#718096", fontSize: "0.85rem" }}>
                  chỗ ngồi
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classrooms;
