import React from "react";
import styles from "./Home.module.css";

const Home = () => {
  return (
    <div className={styles.container}>
      <h1>Welcome to Teacher Assignment & Scheduling System</h1>
      <p>Use the sidebar to manage teachers, classrooms, courses, and schedules.</p>
    </div>
  );
};

export default Home;
