import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/home/Home";
import Users from "./pages/users/Users";
import Messages from "./pages/messages/Messages";
import Login from "./pages/login/Login";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Menu from "./components/menu/Menu";
import ProtectedRoute from "./components/protectedRoute/ProtectedRoute";
import { AuthProvider } from "./auth/AuthContext";
import "./styles/global.scss";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A 401 is a dead session, not a blip — retrying it three times just delays
      // the redirect to the login screen.
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const Layout = () => (
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

const router = createBrowserRouter([
  {
    path: "/",
    // The guard wraps the whole shell, not each page: an unauthenticated visitor
    // should not see the chrome either. Real enforcement is server-side.
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/", element: <Home /> },
      { path: "/users", element: <Users /> },
      { path: "/messages", element: <Messages /> },
    ],
  },
  { path: "/login", element: <Login /> },
]);

/**
 * Provider order matters. AuthProvider sits ABOVE RouterProvider so the session
 * probe runs once for the whole app; QueryClientProvider sits above both so the
 * guard's children can query without each route mounting its own cache — the
 * template had the client inside the layout, which meant the login route had no
 * query context at all.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
