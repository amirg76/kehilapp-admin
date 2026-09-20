import { Urgency } from "../../api/kehilapp";

/**
 * The urgency enum rendered for a human, in the order the server's enum
 * declares it (routine → urgent), so the radio order reads as a scale.
 *
 * Shared rather than declared per page. It started life inside NewMessage.tsx as
 * a table instead of three hand-written blocks, for a reason that got stronger
 * once a second form needed it: the compose form, the edit form and the messages
 * table all name the same three levels, and separate copies drift. The failure
 * is quiet — the day the server's enum gains a level, whichever copy was missed
 * falls through to rendering the raw English value at the admin.
 */
export const URGENCY_OPTIONS: ReadonlyArray<{ value: Urgency; label: string; hint: string }> = [
  { value: "routine", label: "שגרה", hint: "ברירת המחדל — הודעה רגילה." },
  { value: "important", label: "חשוב", hint: "כדאי לקרוא, אך לא דורש פעולה מיידית." },
  { value: "urgent", label: "דחוף", hint: "דורש תשומת לב מיידית." },
];

/** Single lookup into that table, so the labels exist in exactly one place. */
export const urgencyLabel = (value: Urgency) =>
  URGENCY_OPTIONS.find((option) => option.value === value)?.label ?? value;

/**
 * Narrows whatever the server sent to a level the UI can name.
 *
 * A message document written before the urgency field shipped carries no value
 * at all, and the server's default for those is "routine" (messageModel.js), so
 * an absent value is read as routine here rather than shown as "unknown" — which
 * it is not — or handed to a form field that would then hold undefined.
 */
export const urgencyOf = (value?: string): Urgency =>
  value === "important" || value === "urgent" ? value : "routine";
