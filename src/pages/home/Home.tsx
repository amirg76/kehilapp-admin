import { useQuery } from "@tanstack/react-query";
import { categoriesApi, messagesApi, usersApi } from "../../api/kehilapp";
import { errorMessage } from "../../services/http";
import "./home.scss";

type Tile = { label: string; value: string; hint: string };

const Home = () => {
  // One page of everything the board holds. Small dataset by design — this is a
  // single kibbutz, not a network.
  const messages = useQuery({
    queryKey: ["messages"],
    queryFn: () => messagesApi.list({ limit: 200 }),
  });
  const users = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list() });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => categoriesApi.list() });

  const items = messages.data?.items ?? [];
  const accounts = users.data ?? [];

  // The showcase number: how much of the board an anonymous visitor can see
  // versus a signed-in member. It is the content-tier feature, counted.
  const membersOnly = items.filter((m) => m.visibility === "members").length;
  const publicCount = items.length - membersOnly;

  // Verified their email but not yet admitted by an admin — the queue this
  // tile exists to surface. Admins are excluded: an admin account's approval
  // state doesn't gate anything for them (every auth check bypasses on role),
  // so counting them here would inflate a number that isn't actually a queue.
  const pendingApprovalCount = accounts.filter(
    (u) => u.role !== "admin" && u.emailVerified && !u.approved
  ).length;

  const loading = messages.isLoading || users.isLoading || categories.isLoading;
  const firstError = messages.error ?? users.error ?? categories.error;

  const tiles: Tile[] = [
    {
      label: "הודעות",
      value: String(messages.data?.total ?? items.length),
      hint: `${publicCount} ציבוריות · ${membersOnly} לחברים בלבד`,
    },
    {
      label: "חשבונות",
      value: String(accounts.length),
      hint: `${accounts.filter((u) => u.role === "admin").length} מנהלים`,
    },
    {
      label: "מאומתי אימייל",
      value: String(accounts.filter((u) => u.emailVerified).length),
      hint: `מתוך ${accounts.length} חשבונות`,
    },
    {
      label: "ממתינים לאישור",
      value: String(pendingApprovalCount),
      hint: "אימתו אימייל, טרם אושרו ע\"י מנהל",
    },
    {
      label: "קטגוריות",
      value: String((categories.data ?? []).length),
      hint: "מבנה הלוח",
    },
  ];

  return (
    <div className="home">
      <h1>סקירה</h1>

      {firstError ? (
        <div className="error" role="alert">
          {errorMessage(firstError, "טעינת הנתונים נכשלה.")}
        </div>
      ) : null}

      <div className="tiles">
        {tiles.map((tile) => (
          <div className="tile" key={tile.label}>
            <span className="label">{tile.label}</span>
            <span className="value">{loading ? "…" : tile.value}</span>
            <span className="hint">{loading ? "" : tile.hint}</span>
          </div>
        ))}
      </div>

      <div className="recent">
        <h2>הודעות אחרונות</h2>
        {loading && <p className="muted">טוען…</p>}
        {!loading && items.length === 0 && <p className="muted">אין הודעות להצגה.</p>}
        <ul>
          {items.slice(0, 8).map((m) => (
            <li key={m._id}>
              <span className="title">{m.title}</span>
              <span className={`tier ${m.visibility === "members" ? "members" : "public"}`}>
                {m.visibility === "members" ? "חברים" : "ציבורי"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
