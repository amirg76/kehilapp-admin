import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, MESSAGE_LIMITS, messagesApi } from "../../api/kehilapp";
import { errorMessage } from "../../services/http";
import "./newMessage.scss";

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

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  const create = useMutation({
    mutationFn: () => messagesApi.create({ categoryId, title, text, visibility }),
    onSuccess: (message) => {
      // The list is the authority on what actually landed; invalidate rather
      // than splice a locally-built row into the cache.
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      navigate("/messages", { state: { publishedTitle: message.title } });
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
        </div>

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
