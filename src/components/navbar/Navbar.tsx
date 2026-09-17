import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./navbar.scss";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="logo">
        <span>Kehilapp · ניהול</span>
      </div>
      <div className="icons">
        {/* The real signed-in identity, resolved from the httpOnly session cookie
            via /api/auth/me. The template hard-coded "Jane" and a stock photo
            fetched from an external host on every page load. */}
        {user && (
          <div className="user">
            <span className="name">{user.name}</span>
            <span className="role">{user.role === "admin" ? "מנהל" : "חבר"}</span>
          </div>
        )}
        <button type="button" className="logout" onClick={handleLogout}>
          התנתק
        </button>
      </div>
    </header>
  );
};

export default Navbar;
