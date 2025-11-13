import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import Home from "../pages/Home/Home";
import Teachers from "../pages/Teachers/Teachers";
import Classrooms from "../pages/Classrooms/Classrooms";
import Courses from "../pages/Courses/Courses";
import Sections from "../pages/Sections/Sections";
import Periods from "../pages/Periods/Periods";
import Schedule from "../pages/Schedule/Schedule";
import Settings from "../pages/Settings/Settings";
import TeachingRegistration from "../pages/TeachingRegistration/TeachingRegistration";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/teachers", element: <Teachers /> },
      { path: "/classrooms", element: <Classrooms /> },
      { path: "/courses", element: <Courses /> },
      { path: "/sections", element: <Sections /> },
      { path: "/periods", element: <Periods /> },
      { path: "/schedule", element: <Schedule /> },
  { path: "/teaching-registration", element: <TeachingRegistration /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
]);
