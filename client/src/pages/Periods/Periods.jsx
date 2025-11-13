import React, { useEffect, useState } from "react";
import styles from "./Periods.module.css";
import { periodsAPI, PERIODS } from "../../api/timeSlots";

const Periods = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await periodsAPI.list();
      setPeriods(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPeriods(PERIODS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className={styles.container}>
      <h2>Danh sách Tiết học</h2>
      <p>Các tiết học được cố định và không thể chỉnh sửa.</p>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : (
        <div className={styles.periodGrid}>
          {periods.map((period) => (
            <div key={period.id} className={styles.periodCard}>
              <div className={styles.periodHeader}>
                <h3>{period.name}</h3>
              </div>
              <div className={styles.periodBody}>
                <div className={styles.timeRow}>
                  <span className={styles.label}>Bắt đầu:</span>
                  <span className={styles.time}>{period.start}</span>
                </div>
                <div className={styles.timeRow}>
                  <span className={styles.label}>Kết thúc:</span>
                  <span className={styles.time}>{period.end}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && periods.length === 0 && (
        <div className={styles.empty}>Không có tiết học nào</div>
      )}
    </div>
  );
};

export default Periods;
