import React from "react";
// routing
import { Navigate } from "react-router-dom";
// routes constants
import { ROOT, MESSAGES, LOGIN, REGISTER } from "@routes/routeConstants.js";
// pages
import Messages from "@pages/Messages.jsx";
import Login from "@pages/Login.jsx";
import Register from "@pages/Register.jsx";
import AdminDashBoard from "../pages/AdminDashBoard";

export const routeConfig = [
  {
    // Main Page - Redirect to the messages page if user go to the main page
    path: ROOT,
    element: <Navigate to={MESSAGES} />,
    exact: true,
  },
  {
    // Login Page
    path: LOGIN,
    element: <Login />,
    exact: true,
  },
  {
    // Register Page
    path: REGISTER,
    element: <Register />,
    exact: true,
  },
  {
    // messages page, redirects to the main category
    path: MESSAGES,
    element: <Messages />,
    exact: true,
  },
  {
    // messages page
    path: `${MESSAGES}/:categoryId`,
    element: <Messages />,
    exact: true,
  },
  //TODO: create a 404 Page for non-existing pages and import here
  //   {
  //     path: "*",
  //     element: "", //404 page
  //     exact: true,
  //   },
];

export const adminRoutes = [
  {
    path: "kissufim/admin/dashboard",
    element: <AdminDashBoard />,
    exact: true,
  },
  // {
  //   path: "/admin/users",
  //   element: <Users />,
  //   exact: true,
  // },
  // {
  //   path: "/admin/settings",
  //   element: <Settings />,
  //   exact: true,
  // },
  // Add more routes here...
];
