import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import styles from "./MainLayout.module.css";

const MainLayout = () => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.content}>
        <Outlet /> {/* Nơi hiển thị nội dung của từng trang */}
      </main>
    </div>
  );
};

export default MainLayout;
