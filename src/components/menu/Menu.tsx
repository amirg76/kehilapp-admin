import { NavLink } from "react-router-dom";
import "./menu.scss";

/**
 * The template shipped a menu of a dozen links to pages that did not exist
 * (Orders, Posts, Calendar, Backups…). Every one of them was a dead end. This is
 * the real surface: three routes, all backed by an endpoint.
 */
const NAV = [
  { to: "/", label: "סקירה", end: true },
  { to: "/messages", label: "הודעות", end: false },
  { to: "/users", label: "משתמשים", end: false },
];

const Menu = () => (
  <nav className="menu" aria-label="ניווט ראשי">
    <div className="item">
      <span className="title">ניהול</span>
      {NAV.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          // aria-current lets a screen reader announce the current page; the
          // template signalled it with colour alone.
          className={({ isActive }) => `listItem${isActive ? " active" : ""}`}
        >
          <span className="listItemTitle">{link.label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default Menu;
