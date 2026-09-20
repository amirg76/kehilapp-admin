import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, MESSAGE_LIMITS, messagesApi, Urgency } from "../../api/kehilapp";
import { errorStatus } from "../../services/http";
import { URGENCY_OPTIONS, urgencyOf } from "./urgencyOptions";
import "./newMessage.scss";

/** The five fields the server's update schema accepts. */
type Draft = {
  title: string;
  text: string;
  categoryId: string;
  visibility: "public" | "members";
  urgency: Urgency;
};

/**
 * Hebrew for a failed save, chosen by HTTP STATUS.
 *
 * Never by the API's text: it is English, it is not part of any contract, and a
 * wording change on the backend would silently swap what the admin reads here
 * for something else — or for nothing. Same rule the classifier errors in
 * NewMessage.tsx follow, and the reason `errorStatus` exists in services/http.ts.
 *
 * A null status means the request never got an answer at all — server down, CORS
 * refusal, aborted — which is a different thing to tell someone than "refused".
 */
const saveErrorText = (error: unknown): string => {
  switch (errorStatus(error)) {
    case 400:
      // The one refusal the admin can act on alone: the server caps a title at
      // 25 characters and a body at 1500, and this form can hold a value that
      // breaks one of those caps (see the note on `titleOverLimit` below for how
      // an over-long title still reaches it). Naming the cap in the message is
      // what turns a dead-end 400 into something the admin can fix.
      return "השרת דחה את הפרטים. ודא שהכותרת אינה ארוכה מהמותר ושנבחרה קטגוריה.";
    case 401:
      return "פג תוקף ההתחברות. התחבר מחדש ונסה שוב.";
    case 403:
      return "אין לך הרשאה לשנות את ההודעה הזאת.";
    case 404:
      return "ההודעה לא נמצאה. ייתכן שנמחקה בינתיים.";
    case null:
      return "השרת לא ענה. בדוק את החיבור ונסה שוב.";
    default:
      return "שמירת השינויים נכשלה. נסה שוב.";
  }
};

/**
 * Editing one message — an admin act, by owner-independent design.
 *
 * The server's PATCH route is guarded by `auth` + `requireApproved` rather than
 * `requireRole('admin')`, and ownership is enforced one layer down: the
 * repository filters by `senderId` for a member and by `_id` alone for an admin.
 * So this page can edit any author's message, and a member using the resident
 * app still cannot touch one that is not theirs. Confirmed against the running
 * server, not inferred: an admin PATCH on a message authored by a seeded member
 * answered 200 and the row changed.
 *
 * A page rather than a dialog, for the same reason NewMessage.tsx is one: it
 * carries a category fetch and five fields, it needs its own URL so a refresh
 * lands back on the message being edited, and the confirm dialog on the list
 * page is built for three lines of text.
 */
const EditMessage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const message = useQuery({
    queryKey: ["message", id],
    queryFn: () => messagesApi.byId(id as string),
    enabled: Boolean(id),
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  // Null until both queries have answered. The form cannot be initialised from
  // useState's initialiser — that runs on the first render, long before the
  // message arrives — so it is seeded by the effect below instead.
  const [draft, setDraft] = useState<Draft | null>(null);
  // Which message the draft was seeded FROM. This is the guard that stops the
  // effect from overwriting what the admin is typing: a background refetch, or
  // the refetch that follows a successful save, delivers a new object for the
  // same id, and without this the fields would snap back to the server's copy
  // mid-edit.
  const [seededFrom, setSeededFrom] = useState<string | null>(null);

  useEffect(() => {
    const loaded = message.data;
    // Categories are part of the condition, not just the message: the seeding
    // below decides whether to keep the stored category by looking it up in this
    // list, and running that decision against a list that has not arrived yet
    // would clear a category that is perfectly valid.
    if (!loaded || !categories.data || seededFrom === loaded._id) return;

    // A <select> handed a value with no matching <option> renders as "nothing
    // picked" while the state behind it holds a truthy id — the save button
    // would look enabled with no visible selection. Same trap NewMessage.tsx
    // documents for the classifier's suggestion. Here it means a category that
    // was deleted after the message was written, so the honest move is to empty
    // the field, let the disabled button say so, and explain it in a hint.
    const known = categories.data.some((c) => c._id === loaded.categoryId);

    setDraft({
      title: loaded.title,
      // A message stored with no body is legal on the server (Joi allows '' and
      // the controller writes it through), so "" is the right prefill rather
      // than a reason to fail.
      text: loaded.text ?? "",
      categoryId: known ? (loaded.categoryId as string) : "",
      // Both fall back to the server's own defaults, which is what a document
      // written before these fields shipped actually behaves as — see the
      // schema defaults in messageModel.js.
      visibility: loaded.visibility === "members" ? "members" : "public",
      urgency: urgencyOf(loaded.urgency),
    });
    setSeededFrom(loaded._id);
  }, [message.data, categories.data, seededFrom]);

  const save = useMutation({
    mutationFn: (values: Draft) => messagesApi.update(id as string, values),
    onSuccess: (updated) => {
      // The list and this message both now disagree with the cache. Invalidate
      // rather than write the response into it by hand: the server is the
      // authority on what landed, and it normalises fields this form does not
      // send (updatedAt, and any tier it refused to change).
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["message", id] });
      navigate("/messages", { state: { savedTitle: updated.title } });
    },
  });

  // string.length counts UTF-16 code units — exactly what the server's Joi
  // .max() counts on the string it receives, so this is the correct backstop to
  // mirror, not a visual approximation of it.
  const titleLength = draft?.title.length ?? 0;
  const textLength = draft?.text.length ?? 0;

  const titleValid = titleLength >= MESSAGE_LIMITS.titleMin && titleLength <= MESSAGE_LIMITS.titleMax;
  const textValid = textLength <= MESSAGE_LIMITS.textMax;

  // At the cap, not over it — for the same reason NewMessage.tsx gives: both
  // fields carry maxLength, the browser refuses the next character outright, and
  // a probe against a real browser proved the typed "over the limit" branch dead.
  const titleAtLimit = titleLength >= MESSAGE_LIMITS.titleMax;
  const textAtLimit = textLength >= MESSAGE_LIMITS.textMax;

  // The one place this form must NOT copy that reasoning. maxLength only stops
  // TYPING; it does not truncate a value assigned from code, and this form's
  // opening value comes from the database.
  //
  // The schema now caps `title` as well (messageModel.js sets maxlength from
  // messageConstants.titleMaxLength), and the demo seed no longer writes
  // anything over it — measured on scripts/seedDemo.js: 31 titles, longest 25,
  // zero above 25. So neither of those is the reason this branch exists any
  // more.
  //
  // It stays for a reason that a schema cap cannot close: the update path is
  // `findOneAndUpdate(..., { runValidators: true })` (messageRepository.js), and
  // mongoose update validators run only against the fields present in the
  // update. A document written BEFORE the cap existed is never revalidated by
  // anything, so it can still be read out of the collection and loaded into this
  // form with an over-long title. The save then fails on Joi at the HTTP layer
  // with a 400. That is why `titleValid` has an upper bound at all, and why the
  // over-limit state has to be named on screen rather than left as a mute
  // refusal.
  const titleOverLimit = titleLength > MESSAGE_LIMITS.titleMax;

  const canSubmit =
    draft !== null &&
    titleValid &&
    textValid &&
    draft.categoryId.length > 0 &&
    !categories.isError &&
    !save.isLoading;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !draft) return;
    save.mutate(draft);
  };

  /** Applies one field without losing the rest of the draft. */
  const patchDraft = (changes: Partial<Draft>) =>
    setDraft((current) => (current ? { ...current, ...changes } : current));

  if (message.isError) {
    return (
      <div className="editMessage">
        <div className="info">
          <h1>עריכת הודעה</h1>
          <button type="button" className="back" onClick={() => navigate("/messages")}>
            חזרה להודעות
          </button>
        </div>
        <div className="error" role="alert">
          {errorStatus(message.error) === 404
            ? "ההודעה לא נמצאה. ייתכן שנמחקה."
            : "טעינת ההודעה נכשלה. נסה שוב."}
        </div>
      </div>
    );
  }

  return (
    <div className="editMessage">
      <div className="info">
        <h1>עריכת הודעה</h1>
        <button type="button" className="back" onClick={() => navigate("/messages")}>
          חזרה להודעות
        </button>
      </div>

      {draft === null ? (
        <p className="loading">טוען את ההודעה…</p>
      ) : (
        <form className="newMessageForm" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">כותרת</label>
            <input
              id="title"
              type="text"
              maxLength={MESSAGE_LIMITS.titleMax}
              value={draft.title}
              onChange={(e) => patchDraft({ title: e.target.value })}
              aria-describedby={titleOverLimit ? "titleCount titleOverLimit" : "titleCount"}
              required
            />
            <span id="titleCount" className={`counter${titleAtLimit ? " at-limit" : ""}`}>
              {titleLength}/{MESSAGE_LIMITS.titleMax}
            </span>
            {titleOverLimit && (
              <span id="titleOverLimit" className="hint error">
                הכותרת השמורה ארוכה מהמותר לעריכה. קצר אותה כדי לשמור.
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="text">תוכן</label>
            <textarea
              id="text"
              rows={6}
              maxLength={MESSAGE_LIMITS.textMax}
              value={draft.text}
              onChange={(e) => patchDraft({ text: e.target.value })}
              aria-describedby="textCount"
            />
            <span id="textCount" className={`counter${textAtLimit ? " at-limit" : ""}`}>
              {textLength}/{MESSAGE_LIMITS.textMax}
            </span>
          </div>

          <div className="field">
            <label htmlFor="categoryId">קטגוריה</label>
            {categories.isError && (
              <span className="hint error">
                טעינת הקטגוריות נכשלה. לא ניתן לשמור שינויים כרגע.
              </span>
            )}
            <select
              id="categoryId"
              value={draft.categoryId}
              onChange={(e) => patchDraft({ categoryId: e.target.value })}
              disabled={categories.isError}
              required
            >
              <option value="">בחר קטגוריה</option>
              {(categories.data ?? []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            {draft.categoryId === "" && (
              <span className="hint">
                הקטגוריה המקורית של ההודעה אינה זמינה יותר. בחר קטגוריה כדי לשמור.
              </span>
            )}
          </div>

          <fieldset className="visibility">
            <legend>נראוּת</legend>
            <label className="radio">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={draft.visibility === "public"}
                onChange={() => patchDraft({ visibility: "public" })}
                aria-describedby="visibilityPublicHint"
              />
              ציבורי
            </label>
            <span id="visibilityPublicHint" className="hint">
              כל מי שמבקר בלוח רואה את ההודעה, גם ללא התחברות.
            </span>
            <label className="radio">
              <input
                type="radio"
                name="visibility"
                value="members"
                checked={draft.visibility === "members"}
                onChange={() => patchDraft({ visibility: "members" })}
                aria-describedby="visibilityMembersHint"
              />
              חברים בלבד
            </label>
            <span id="visibilityMembersHint" className="hint">
              רק חברי קהילה מאושרים רואים את ההודעה.
            </span>
          </fieldset>

          <fieldset className="urgency">
            <legend>דחיפות</legend>
            {URGENCY_OPTIONS.map((option) => (
              <div key={option.value} className="option">
                <label className="radio">
                  <input
                    type="radio"
                    name="urgency"
                    value={option.value}
                    checked={draft.urgency === option.value}
                    onChange={() => patchDraft({ urgency: option.value })}
                    aria-describedby={`urgency-${option.value}-hint`}
                  />
                  {option.label}
                </label>
                <span id={`urgency-${option.value}-hint`} className="hint">
                  {option.hint}
                </span>
              </div>
            ))}
          </fieldset>

          {save.isError && (
            <div className="error" role="alert">
              {saveErrorText(save.error)}
            </div>
          )}

          <button type="submit" disabled={!canSubmit}>
            {save.isLoading ? "שומר…" : "שמור שינויים"}
          </button>
        </form>
      )}
    </div>
  );
};

export default EditMessage;
