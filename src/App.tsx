import Home from "./pages/home/Home";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";
import Users from "./pages/users/Users";
import Products from "./pages/products/Products";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Menu from "./components/menu/Menu";
import Login from "./pages/login/Login";
import "./styles/global.scss";
import User from "./pages/user/User";
import Product from "./pages/product/Product";

import { useEffect } from "react";

import { authActions } from "@store/slices/authSlice";

const useAuth = () => {
  const user = sessionStorage.getItem("loggedInUser");

  return user ? true : false;
};
const App = () => {
  useEffect(() => {
    useAuth();
  }, []);
  const Layout = () => {
    return (
      <div className="main">
        <Navbar />
        <div className="container">
          <div className="menuContainer">
            <Menu />
          </div>
          <div className="contentContainer">
            <Outlet />
          </div>
        </div>
        <Footer />
      </div>
    );
  };
  // Protected route component
  const ProtectedRoute = () => {
    const isAuthenticated = useAuth();

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return <Outlet />;
  };
  // Login route component
  const LoginRoute = () => {
    const isAuthenticated = useAuth();

    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }

    return <Login />;
  };

  const router = createBrowserRouter([
    {
      path: "/",
      // element: !useAuth() && <Navigate to="/login" replace />,
      element: <ProtectedRoute />,
      children: [
        {
          path: "/",
          element: <Navigate to="/dashboard" replace />,
        },
        {
          element: <Layout />,
          children: [
            {
              path: "dashboard",
              element: <Home />,
            },
            {
              path: "users",
              element: <Users />,
            },
            {
              path: "users/:id",
              element: <User />,
            },
            {
              path: "products",
              element: <Products />,
            },
            {
              path: "products/:id",
              element: <Product />,
            },
          ],
        },
      ],
    },
    {
      path: "/login",
      element: <LoginRoute />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
