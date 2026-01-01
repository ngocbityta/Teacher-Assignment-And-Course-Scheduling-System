import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from "./Periods.module.css";
import { periodAPI } from "../../api/period";

const Periods = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    id: "",
    name: "",
    startTime: "07:00",
    endTime: "08:30",
    orderIndex: 1,
    description: "",
  });
  const [errors, setErrors] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await periodAPI.list();
      setPeriods(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách tiết học: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name || form.name.trim() === "") {
      newErrors.name = "Tên tiết học là bắt buộc";
    }
    
    if (!form.startTime) {
      newErrors.startTime = "Thời gian bắt đầu là bắt buộc";
    }
    
    if (!form.endTime) {
      newErrors.endTime = "Thời gian kết thúc là bắt buộc";
    }
    
    if (form.startTime && form.endTime) {
      const start = new Date(`2000-01-01T${form.startTime}`);
      const end = new Date(`2000-01-01T${form.endTime}`);
      
      if (start >= end) {
        newErrors.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu";
      }
    }
    
    if (!form.orderIndex || form.orderIndex < 1) {
      newErrors.orderIndex = "Thứ tự phải là số nguyên dương";
    }
    
    // Check conflicts with existing periods (excluding current)
    const conflictingPeriod = periods.find(p => {
      if (editing && p.id === editing) return false;
      
      // Check if order index conflicts
      if (p.orderIndex === form.orderIndex) {
        return true;
      }
      
      // Check if time overlaps or is less than 30 minutes apart
      const pStart = new Date(`2000-01-01T${p.startTime}`);
      const pEnd = new Date(`2000-01-01T${p.endTime}`);
      const formStart = new Date(`2000-01-01T${form.startTime}`);
      const formEnd = new Date(`2000-01-01T${form.endTime}`);
      
      const minGap = 30 * 60 * 1000; // 30 minutes in milliseconds
      
      // Check if periods overlap
      if ((formStart < pEnd && formEnd > pStart)) {
        return true;
      }
      
      // Check if gap is less than 30 minutes
      const gapBefore = Math.abs(formStart - pEnd);
      const gapAfter = Math.abs(pStart - formEnd);
      
      if (gapBefore < minGap || gapAfter < minGap) {
        return true;
      }
      
      return false;
    });
    
    if (conflictingPeriod) {
      newErrors.general = `Xung đột với tiết học "${conflictingPeriod.name}" (${conflictingPeriod.startTime} - ${conflictingPeriod.endTime}). Các tiết học phải cách nhau ít nhất 30 phút.`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddClick = () => {
    setEditing(null);
    setForm({
      id: "",
      name: "",
      startTime: "07:00",
      endTime: "08:30",
      orderIndex: periods.length > 0 ? Math.max(...periods.map(p => p.orderIndex || 0)) + 1 : 1,
      description: "",
    });
    setErrors({});
    setShowForm(true);
  };

  const handleEditClick = (period) => {
    setEditing(period.id);
    setForm({
      id: period.id || "",
      name: period.name || "",
      startTime: period.startTime || "07:00",
      endTime: period.endTime || "08:30",
      orderIndex: period.orderIndex || 1,
      description: period.description || "",
    });
    setErrors({});
    setShowForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Xóa tiết học này? Lưu ý: Nếu tiết học đang được sử dụng trong lịch học, bạn không thể xóa.")) return;
    try {
      await periodAPI.remove(id);
      toast.success("Xóa tiết học thành công");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại: " + err.message);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }
    
    try {
      const payload = {
        name: form.name.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        orderIndex: parseInt(form.orderIndex),
        description: form.description?.trim() || "",
      };
      
      if (editing) {
        await periodAPI.update(editing, payload);
        toast.success("Cập nhật tiết học thành công");
      } else {
        payload.id = form.id.trim() || undefined;
        await periodAPI.create(payload);
        toast.success("Thêm tiết học thành công");
      }
      setShowForm(false);
      setEditing(null);
      setForm({
        id: "",
        name: "",
        startTime: "07:00",
        endTime: "08:30",
        orderIndex: 1,
        description: "",
      });
      setErrors({});
      load();
    } catch (err) {
      console.error(err);
      const errorMessage = err.message || "Lưu thất bại";
      toast.error(errorMessage);
      if (errorMessage.includes("conflicts") || errorMessage.includes("30 minutes")) {
        setErrors({ general: errorMessage });
      }
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    // Convert "HH:mm:ss" to "HH:mm"
    return timeStr.substring(0, 5);
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return "";
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    const diffMs = endDate - startDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}p` : ""}`;
    }
    return `${mins}p`;
  };

  return (
    <div className={styles.container}>
      <h2>Quản lý Tiết học</h2>

      <div className={styles.actionButtons}>
        <button onClick={handleAddClick} className={styles.btnAdd}>
          Thêm tiết học mới
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : periods.length === 0 ? (
        <div className={styles.empty}>Không có tiết học nào. Hãy thêm tiết học đầu tiên.</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Thứ tự</th>
                <th>Tên</th>
                <th>Thời gian bắt đầu</th>
                <th>Thời gian kết thúc</th>
                <th>Thời lượng</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.id}>
                  <td>{period.orderIndex}</td>
                  <td><strong>{period.name}</strong></td>
                  <td>{formatTime(period.startTime)}</td>
                  <td>{formatTime(period.endTime)}</td>
                  <td>{calculateDuration(period.startTime, period.endTime)}</td>
                  <td>{period.description || "-"}</td>
                  <td>
                    <button
                      className={styles.btnEdit}
                      onClick={() => handleEditClick(period)}
                    >
                      Sửa
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => handleDeleteClick(period.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className={styles.modal} onClick={() => setShowForm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editing ? "Chỉnh sửa tiết học" : "Thêm tiết học mới"}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <form onSubmit={submitForm}>
              <div className={styles.modalBody}>
                {errors.general && (
                  <div className={styles.errorMessage}>{errors.general}</div>
                )}
                
                {!editing && (
                  <div className={styles.formGroup}>
                    <label>Mã tiết học (tùy chọn)</label>
                    <input
                      type="text"
                      value={form.id}
                      onChange={(e) => setForm({ ...form, id: e.target.value })}
                      placeholder="Để trống để tự động tạo"
                    />
                  </div>
                )}
                
                <div className={styles.formGroup}>
                  <label>Tên tiết học *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="VD: CA1, CA2, Tiết 1..."
                    required
                  />
                  {errors.name && <span className={styles.error}>{errors.name}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label>Thời gian bắt đầu *</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                  />
                  {errors.startTime && <span className={styles.error}>{errors.startTime}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label>Thời gian kết thúc *</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                  />
                  {errors.endTime && <span className={styles.error}>{errors.endTime}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label>Thứ tự *</label>
                  <input
                    type="number"
                    value={form.orderIndex}
                    onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                  />
                  <small style={{ color: "#718096", fontSize: "0.85rem" }}>
                    Thứ tự để sắp xếp các tiết học (1, 2, 3...)
                  </small>
                  {errors.orderIndex && <span className={styles.error}>{errors.orderIndex}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label>Mô tả</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả về tiết học (tùy chọn)"
                    rows="3"
                  />
                </div>
                
                <div className={styles.infoBox}>
                  <strong>Lưu ý:</strong>
                  <ul>
                    <li>Các tiết học phải cách nhau ít nhất 30 phút</li>
                    <li>Thời gian kết thúc phải sau thời gian bắt đầu</li>
                    <li>Thứ tự phải là duy nhất</li>
                  </ul>
                </div>
                
                <div className={styles.formButtons}>
                  <button type="submit" className={styles.btnSubmit}>
                    {editing ? "Cập nhật" : "Tạo mới"}
                  </button>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setShowForm(false)}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Periods;
