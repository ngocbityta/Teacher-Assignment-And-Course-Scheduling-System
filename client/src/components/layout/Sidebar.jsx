import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";
import styles from "./Sidebar.module.css";

const menu = [
  { name: "Home", path: "/", icon: "🏠" },
  { name: "Giảng viên", path: "/teachers", icon: "👩‍🏫" },
  { name: "Phòng học", path: "/classrooms", icon: "🏛️" },
  { name: "Môn học", path: "/courses", icon: "📘" },
  { name: "Học phần", path: "/sections", icon: "📖" },
  { name: "Tiết học", path: "/periods", icon: "⏰" },
  { name: "Xếp lịch", path: "/schedule", icon: "📅" },
  { name: "Đăng ký dạy học", path: "/teaching-registration", icon: "📝" },
  { name: "Cài đặt", path: "/settings", icon: "⚙️" },
];

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <img src={logo} alt="App Logo" className={styles.logo} />
      </div>

      <nav className={styles.nav}>
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.text}>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
