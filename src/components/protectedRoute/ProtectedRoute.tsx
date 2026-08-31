import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

/**
 * Client-side gate for the admin shell.
 *
 * This is a UX affordance, NOT the security boundary. It stops an unauthorised
 * person seeing an empty dashboard chrome; it does not stop them reading data,
 * because it cannot — anyone can edit their own JS. The real enforcement is
 * `auth` + `requireRole('admin')` on the server, which is why every admin-only
 * endpoint carries both and why a member who forces their way to this UI simply
 * gets 401/403 from every request it makes.
 */
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Never redirect while the session probe is still in flight, or a refresh
  // would bounce a signed-in admin to the login screen.
  if (loading) {
    return <div className="routeGate">טוען…</div>;
  }

  if (!user) {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "admin") {
    return (
      <div className="routeGate">
        <h2>אין הרשאה</h2>
        <p>לוח הניהול פתוח למנהלים בלבד. החשבון שלך הוא חשבון חבר.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
