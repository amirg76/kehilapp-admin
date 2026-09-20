import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";
import { darkTheme, lightTheme } from "./theme";
import Home from "./pages/home/Home";
import Users from "./pages/users/Users";
import Messages from "./pages/messages/Messages";
import NewMessage from "./pages/messages/NewMessage";
import EditMessage from "./pages/messages/EditMessage";
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
      { path: "/messages/new", element: <NewMessage /> },
      // Declared after "/messages/new" for readability only — these two cannot
      // collide: the literal segment and ":id" are different path shapes, and
      // React Router ranks a static segment above a dynamic one regardless of
      // declaration order.
      { path: "/messages/:id/edit", element: <EditMessage /> },
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
const App = () => {
  // The two DataGrid pages render real MUI components (GridToolbar's buttons,
  // the column menu, the filter panel, the grid's own text) and MUI knows
  // nothing about this app's stylesheets. With no ThemeProvider above them, MUI
  // fell back to its LIGHT palette defaults — near-black text — on top of this
  // app's dark background, and an axe scan measured it as a 1.61:1 contrast
  // violation on both pages where WCAG requires 4.5:1. src/theme/index.ts is
  // that missing theme, in both modes.
  //
  // Which mode: the operating system's, read once here and mirrored by
  // src/styles/tokens.scss, which flips the same palette under the SAME
  // `prefers-color-scheme` media query. One signal, two consumers — so the
  // grid can never end up light while the page around it is dark. There is
  // deliberately no in-app toggle: that would be a new control, and this change
  // is a repaint, not a new feature.
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = prefersDark ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      {/* Normalises the browser's defaults and, through the theme's
          MuiCssBaseline override, sets `color-scheme` so native scrollbars and
          form-control chrome follow the theme instead of staying bright white
          on a dark page. */}
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
