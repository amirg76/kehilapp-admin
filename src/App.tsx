import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Home from "./pages/home/Home";
import Users from "./pages/users/Users";
import Messages from "./pages/messages/Messages";
import NewMessage from "./pages/messages/NewMessage";
import Login from "./pages/login/Login";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Menu from "./components/menu/Menu";
import ProtectedRoute from "./components/protectedRoute/ProtectedRoute";
import { AuthProvider } from "./auth/AuthContext";
import "./styles/global.scss";

// The app is dark-themed everywhere via CSS (see styles/variables.scss), but
// the two DataGrid pages (Users, Messages) render real MUI components
// (GridToolbar's buttons, column menus, the grid's own text) with no
// ThemeProvider above them — so MUI fell back to its LIGHT palette defaults
// (near-black text) on top of this app's dark background. An axe scan caught
// it as a 1.61:1 color-contrast violation on both pages (WCAG requires
// 4.5:1). A single dark theme, scoped once at the app root, fixes every MUI
// surface at once instead of hand-picking colors per column.
const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#2a3447", paper: "#2a3447" },
  },
});

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
      { path: "/messages/new", element: <NewMessage /> },
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
  <ThemeProvider theme={theme}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
