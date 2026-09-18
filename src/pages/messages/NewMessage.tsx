import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  categoriesApi,
  MESSAGE_LIMITS,
  MessageClassification,
  messagesApi,
  Urgency,
} from "../../api/kehilapp";
import { errorMessage, errorStatus } from "../../services/http";
import "./newMessage.scss";

/**
 * The urgency enum rendered for a human, in the order the server's enum
 * declares it (routine → urgent), so the radio order reads as a scale.
 *
 * A table rather than three hand-written blocks because the same labels are
 * needed twice on this page — once for the radios, once to name the
 * classifier's suggestion — and two copies drift.
 */
const URGENCY_OPTIONS: ReadonlyArray<{ value: Urgency; label: string; hint: string }> = [
  { value: "routine", label: "שגרה", hint: "ברירת המחדל — הודעה רגילה." },
  { value: "important", label: "חשוב", hint: "כדאי לקרוא, אך לא דורש פעולה מיידית." },
  { value: "urgent", label: "דחוף", hint: "דורש תשומת לב מיידית." },
];

/** Single lookup into that table, so the labels exist in exactly one place. */
const urgencyLabel = (value: Urgency) =>
  URGENCY_OPTIONS.find((option) => option.value === value)?.label ?? value;

/**
 * A page, not a modal: it carries a category fetch and four fields, which is
 * more than the three-line confirm dialog on the list page is built for. It
 * gets a real URL and a working back button instead of state trapped in
 * Messages.tsx.
 */
const NewMessage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [visibility, setVisibility] = useState<"public" | "members">("public");
  // "routine" is the server's default for this field; starting anywhere else
  // would mean every message the admin does not think about gets escalated.
  const [urgency, setUrgency] = useState<Urgency>("routine");

  // What the classifier came back with, kept so its reasoning stays on screen
  // after the form fields have been filled from it. Null until asked.
  const [suggestion, setSuggestion] = useState<MessageClassification | null>(null);
  // A short Hebrew line explaining why a suggestion could not be produced. Held
  // separately from `suggestion` because a failed attempt must not leave the
  // previous suggestion's text standing next to a new error.
  const [suggestNotice, setSuggestNotice] = useState<string | null>(null);
  // Flipped by a 503 and never flipped back: a missing API key is a server
  // configuration fact, not a transient failure, so re-offering the button
  // would only buy the admin another round trip to the same answer.
  const [suggestOff, setSuggestOff] = useState(false);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  const create = useMutation({
    mutationFn: () => messagesApi.create({ categoryId, title, text, visibility, urgency }),
    onSuccess: (message) => {
      // The list is the authority on what actually landed; invalidate rather
      // than splice a locally-built row into the cache.
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      navigate("/messages", { state: { publishedTitle: message.title } });
    },
  });

  /**
   * The classifier is advisory. It fills the two fields and then gets out of
   * the way: the admin can change the category and the urgency afterwards, and
   * nothing here submits the form. Publishing stays a deliberate human act
   * because the model is guessing and a wrong `visibility`-adjacent decision on
   * a community board is not cheap to take back.
   */
  const classify = useMutation({
    mutationFn: () => messagesApi.classify({ title, text }),
    onSuccess: (result) => {
      setSuggestion(result);
      setSuggestNotice(null);
      setUrgency(result.urgency);

      // Only adopt the category if this client actually has it. A <select>
      // handed a value with no matching <option> renders as "nothing picked"
      // while `categoryId` holds a truthy id — the submit button would look
      // enabled with no visible selection behind it. The suggestion panel still
      // shows what the model said either way.
      const known = (categories.data ?? []).some((c) => c._id === result.categoryId);
      if (known) setCategoryId(result.categoryId);
    },
    onError: (error) => {
      setSuggestion(null);
      // Branch on the status, never on the server's text: the API's messages
      // are not guaranteed to be Hebrew and rewording one on the backend would
      // silently change what the admin reads here.
      switch (errorStatus(error)) {
        case 503:
          setSuggestOff(true);
          setSuggestNotice(null);
          break;
        case 429:
          setSuggestNotice("יותר מדי בקשות להצעת קטגוריה. המתן רגע ונסה שוב.");
          break;
        default:
          setSuggestNotice("לא הצלחנו להציע קטגוריה. אפשר לבחור קטגוריה ודחיפות ידנית.");
      }
    },
  });

  // string.length counts UTF-16 code units — exactly what the server's Joi
  // .max() counts on the string it receives, so this is the correct backstop
  // to mirror, not a visual approximation of it.
  const titleLength = title.length;
  const textLength = text.length;

  const titleValid = titleLength >= MESSAGE_LIMITS.titleMin && titleLength <= MESSAGE_LIMITS.titleMax;
  const textValid = textLength > 0 && textLength <= MESSAGE_LIMITS.textMax;
  const canSubmit =
    titleValid && textValid && categoryId.length > 0 && !categories.isError && !create.isLoading;

  // Same two validity flags the submit button uses, deliberately reused rather
  // than recomputed: with an empty or over-long title, or no body text, there
  // is nothing for the classifier to read and the call would burn a paid
  // request to be told so.
  // The category list is part of this too, not just the draft. The suggestion
  // panel states flatly that "the fields were filled from the suggestion", but
  // the category is only adopted when this client already holds a matching
  // option — so a click fired before the categories query resolved would set the
  // urgency, leave the category untouched, and say otherwise. Requiring the list
  // here makes the sentence true instead of rewording it to admit it might not
  // be, and it also stops a billed call whose answer could only be half used.
  const canSuggest =
    titleValid &&
    textValid &&
    !classify.isLoading &&
    !categories.isLoading &&
    !categories.isError &&
    (categories.data?.length ?? 0) > 0;

  // At the cap, not over it. Both fields carry maxLength, so the browser
  // refuses the next character outright and a "you have gone over" state can
  // never be reached -- a probe run against a real browser proved that branch
  // was dead. What a typist actually experiences is the field going quiet, so
  // the counter is what has to explain it.
  const titleAtLimit = titleLength >= MESSAGE_LIMITS.titleMax;
  const textAtLimit = textLength >= MESSAGE_LIMITS.textMax;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    create.mutate();
  };

  return (
    <div className="newMessage">
      <div className="info">
        <h1>הודעה חדשה</h1>
        <button type="button" className="back" onClick={() => navigate("/messages")}>
          חזרה להודעות
        </button>
      </div>

      <form className="newMessageForm" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">כותרת</label>
          <input
            id="title"
            type="text"
            maxLength={MESSAGE_LIMITS.titleMax}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-describedby="titleCount"
            required
          />
          <span id="titleCount" className={`counter${titleAtLimit ? " at-limit" : ""}`}>
            {titleLength}/{MESSAGE_LIMITS.titleMax}
          </span>
        </div>

        <div className="field">
          <label htmlFor="text">תוכן</label>
          <textarea
            id="text"
            rows={6}
            maxLength={MESSAGE_LIMITS.textMax}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby="textCount"
            required
          />
          <span id="textCount" className={`counter${textAtLimit ? " at-limit" : ""}`}>
            {textLength}/{MESSAGE_LIMITS.textMax}
          </span>
        </div>

        <div className="field">
          <label htmlFor="categoryId">קטגוריה</label>
          {categories.isLoading && <span className="hint">טוען קטגוריות…</span>}
          {categories.isError && (
            <span className="hint error">
              {errorMessage(categories.error, "טעינת הקטגוריות נכשלה. לא ניתן לפרסם הודעה כרגע.")}
            </span>
          )}
          <div className="categoryRow">
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categories.isLoading || categories.isError}
              required
            >
              <option value="">בחר קטגוריה</option>
              {(categories.data ?? []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Gone entirely once the server has said 503: a button that can
                only fail is worse than no button. Everything else on this form
                is untouched by that — the admin picks a category as before. */}
            {!suggestOff && (
              <button
                type="button"
                className="suggestBtn"
                onClick={() => classify.mutate()}
                disabled={!canSuggest}
                aria-describedby="suggestHint"
              >
                {classify.isLoading ? "מנתח…" : "הצע קטגוריה"}
              </button>
            )}
          </div>

          {suggestOff ? (
            <span className="hint">שירות הצעת הקטגוריה אינו מוגדר בשרת הזה.</span>
          ) : (
            <span id="suggestHint" className="hint">
              ממלא קטגוריה ודחיפות לפי הכותרת והתוכן. זו הצעה בלבד — אפשר לשנות אותה אחר כך.
            </span>
          )}
        </div>

        {/* role="alert" so the result reaches a screen reader without the admin
            having to go hunting for it — same precedent as the publish error
            box below. The panel holds the model's reasoning, which is the only
            thing that lets the admin judge whether to keep the suggestion. */}
        {(suggestion || suggestNotice) && (
          <div className="suggestion" role="alert">
            {suggestion && (
              <>
                <p className="headline">
                  הצעה: {suggestion.categoryTitle} · דחיפות {urgencyLabel(suggestion.urgency)}
                </p>
                <p className="reason">{suggestion.reason}</p>
                <p className="disclaimer">
                  השדות מולאו לפי ההצעה. ההחלטה שלך — אפשר לשנות קטגוריה ודחיפות לפני הפרסום.
                </p>
              </>
            )}
            {suggestNotice && <p className="reason">{suggestNotice}</p>}
          </div>
        )}

        <fieldset className="visibility">
          <legend>נראוּת</legend>
          <label className="radio">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
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
              checked={visibility === "members"}
              onChange={() => setVisibility("members")}
              aria-describedby="visibilityMembersHint"
            />
            חברים בלבד
          </label>
          <span id="visibilityMembersHint" className="hint">
            רק חברי קהילה מאושרים רואים את ההודעה.
          </span>
        </fieldset>

        {/* Same fieldset/legend/aria-describedby shape as נראוּת above: three
            mutually exclusive choices belong in a radio group, and the group
            needs a name of its own or a screen reader reads three loose radios
            with no idea what they are grouping. */}
        <fieldset className="urgency">
          <legend>דחיפות</legend>
          {URGENCY_OPTIONS.map((option) => (
            <div key={option.value} className="option">
              <label className="radio">
                <input
                  type="radio"
                  name="urgency"
                  value={option.value}
                  checked={urgency === option.value}
                  onChange={() => setUrgency(option.value)}
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

        {create.isError && (
          <div className="error" role="alert">
            {errorMessage(create.error, "פרסום ההודעה נכשל. נסה שוב.")}
          </div>
        )}

        <button type="submit" disabled={!canSubmit}>
          {create.isLoading ? "מפרסם…" : "פרסם הודעה"}
        </button>
      </form>
    </div>
  );
};

export default NewMessage;
