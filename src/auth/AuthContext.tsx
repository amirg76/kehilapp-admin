import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { authApi, SessionUser } from "../api/kehilapp";
import { setUnauthorizedHandler } from "../services/http";

/**
 * Session state for the admin.
 *
 * The session itself lives in an httpOnly cookie the browser holds and JS cannot
 * read. This context is only a *cache* of who that cookie belongs to, refilled
 * from `GET /api/auth/me` on mount. That distinction matters: nothing here is a
 * credential, so nothing here is worth stealing, and tampering with it grants
 * no access — every request is re-authorised by the server.
 */

type AuthState = {
  user: SessionUser | null;
  /** True until the initial `me` probe settles, so guards don't flash the login page. */
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on mount. A 401 here is the normal "not signed in"
  // answer, not an error worth surfacing.
  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((session) => {
        if (!cancelled) setUser(session);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A 401 on any other call means the cookie died mid-session (expired, or the
  // account was removed). Drop the cached identity; the guard does the rest.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    setUser(session);
    return session;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Clear locally even if the call failed — the user asked to be signed out,
      // and a stale cached identity is the one state worse than being logged out.
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
