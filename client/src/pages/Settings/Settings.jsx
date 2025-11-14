import React, { useEffect, useState } from "react";
import styles from "./Settings.module.css";
import {
  DEFAULT_SEMESTER,
  SEMESTER_OPTIONS,
  getStoredSemester,
  setStoredSemester,
} from "../../store/semester";

const Settings = () => {
  const [selected, setSelected] = useState(() => getStoredSemester() || DEFAULT_SEMESTER);

  useEffect(() => {
    if (selected) {
      setStoredSemester(selected);
    }
  }, [selected]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Cài đặt</h2>

        <div className={styles.formGroup} style={{ marginTop: 12 }}>
          <label>Học kỳ mặc định</label>

          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {SEMESTER_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <div className={styles.helper}>
            Đang chọn:{" "}
            {SEMESTER_OPTIONS.find((x) => x.value === selected)?.label || selected}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
