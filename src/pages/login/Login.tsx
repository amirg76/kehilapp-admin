import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { AxiosError } from "axios";
import "./login.scss";

/**
 * Login failures translated by STATUS, not by echoing the server's prose.
 *
 * The API answers in English ("Unauthorized"), which is right for an API and
 * wrong for this screen — the previous version surfaced it verbatim into a
 * Hebrew form. Mapping on status also keeps the deliberate ambiguity of 401: the
 * backend refuses to say whether the email or the password was wrong, and this
 * must not accidentally reveal it either.
 */
const loginError = (error: unknown): string => {
  const status = (error as AxiosError)?.response?.status;
  if (status === 401) return "האימייל או הסיסמה שגויים.";
  if (status === 403) return "החשבון קיים אך האימייל טרם אומת. בדוק את תיבת הדואר שלך.";
  if (status === 429) return "יותר מדי ניסיונות התחברות. המתן דקה ונסה שוב.";
  if (status === 400) return "פרטי ההתחברות אינם תקינים.";
  // No status at all means the request never reached the server.
  if (!status) return "אין תקשורת עם השרת. ודא שהבקאנד פועל על 5001.";
  return "ההתחברות נכשלה. נסה שוב.";
};

const Login = () => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (e.g. navigated here by hand) — go where they were headed.
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  if (!loading && user) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await login(email, password);
      if (session.role !== "admin") {
        // The server would refuse every admin call anyway; say so here rather
        // than dropping them into a dashboard where nothing loads.
        setError("החשבון הזה אינו חשבון מנהל ואין לו גישה ללוח הניהול.");
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      // The API answers wrong-email and wrong-password identically on purpose;
      // do not embellish it here into something that distinguishes them.
      setError(loginError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <form className="loginBox" onSubmit={handleSubmit}>
        <h1>לוח ניהול</h1>
        <p className="sub">Kehilapp — קיבוץ כיסופים</p>

        <label htmlFor="email">אימייל</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">סיסמה</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* role="alert" so a screen reader announces the failure without the
            user having to hunt for it. */}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "מתחבר…" : "התחבר"}
        </button>
      </form>
    </div>
  );
};

export default Login;
