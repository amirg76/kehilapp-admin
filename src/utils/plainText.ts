/**
 * Turn member- and admin-supplied text into something a grid can display as
 * itself.
 *
 * WHERE THIS LIVES. It started as src/pages/messages/plainText.ts, next to its
 * only consumer. It now has two, in different page directories (messages and
 * users), so it sits in src/utils/ — the same place the resident app keeps its
 * pure text helpers (kehilapp-front-hardened/src/utils/bidiText.js,
 * urlSafety.js). Not src/services/: that directory is the axios/HTTP layer, and
 * nothing here does I/O. Also the one path a plain `node` check script can
 * import without reaching through a page directory (see
 * scripts/plain-text-check.mjs).
 *
 * WHAT THIS PREVENTS. Unicode bidi control characters are invisible: they change
 * the DIRECTION the characters after them are laid out in, not the characters
 * themselves. An approved member can post a title — or register a NAME —
 * containing U+202E (RIGHT-TO-LEFT OVERRIDE) and the admin then reads, in the
 * grid, a string that renders differently from the one that is stored.
 *
 * On the messages grid that is immediately before choosing "ערוך" or "מחק" on
 * that row. On the users grid the stakes are higher: it is the text an admin
 * reads while promoting someone to admin or revoking an account, so a name that
 * renders as one person can be another. The admin acts on the rendering; the
 * database holds something else. Display-level deception, not code execution.
 *
 * The server does not stop it. `Joi.string().max(120)` on `name`
 * (kehilapp-backend-hardened) carries no character restriction, so registering
 * with U+202E in the name is accepted; and when `name` is empty,
 * authController.js falls back to `email.split('@')[0]`, with
 * `Joi.string().email()` accepting bidi controls in the local part. Both roads
 * end at these two grids, so the strip has to happen here.
 *
 * This panel is `dir="rtl"`, which removes the usual tell. In a left-to-right
 * table a reversed run looks obviously wrong; here a right-to-left run is the
 * normal case, so there is nothing for the eye to catch.
 *
 * THE CODE POINTS. The same twelve the resident app refuses in URLs — see
 * kehilapp-front-hardened/src/utils/urlSafety.js, whose header records the
 * measurement behind the list: enumerating \p{Bidi_Control} over the whole code
 * space on node v24.13.0 yields exactly these twelve, U+061C included. U+061C
 * (the Arabic letter mark) was missing from an earlier hand-written list in that
 * file and is a strong-RTL character, so omitting it leaves exactly the hole the
 * rest of the list closes. The two repos share no code, so this repo keeps its
 * own copy of the list — but scripts/plain-text-check.mjs re-runs that same
 * enumeration against node's own Unicode tables on every `npm run check`, so a
 * copy that drifts from Unicode fails the build rather than going unnoticed.
 *
 * STRIP HERE, REFUSE THERE. urlSafety.js REJECTS a URL containing these rather
 * than cleaning it, because it must guarantee that the rendered message rejoins
 * to the author's text verbatim. This is a different job: a grid cell is already
 * a lossy summary (it collapses whitespace and the column ellipsises), nothing
 * downstream reconstructs the original from it, and an admin needs the row to
 * stay identifiable rather than to disappear. So here the characters are
 * removed and the visible text is left intact.
 */

/**
 * The bidi code points this module removes. THIS is the source of truth: the
 * regex below is built from it, so the exported list cannot describe one set
 * while the strip applies another.
 *
 * It used to be the other way round — the regex held the twelve characters as
 * pasted-in literals and this array was a hand-maintained echo of them. Two
 * things were wrong with that. The literals are invisible, so the actual policy
 * could not be read, reviewed in a diff or even counted by eye; and the array
 * and the regex were two sources of truth that could disagree without anything
 * saying so. Written as hex code points and compiled into a class at module
 * load, both problems go away.
 */
export const BIDI_CONTROL_CODE_POINTS = Object.freeze([
  0x061c, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066,
  0x2067, 0x2068, 0x2069,
]);

/**
 * The shared list as an ordinary character class, e.g. "[؜‎…]",
 * built once at module load.
 *
 * Deliberately NOT /\p{Bidi_Control}/u: the resident repo's urlSafety.js
 * records why (a Unicode-property/lookbehind construct there survived into the
 * built bundle and would have thrown at module load on Safari before 16.4 — a
 * blank application). The class built here needs no engine feature either; it
 * is plain \uXXXX escapes. Building it from the array rather than typing the
 * characters out is what makes drift impossible.
 */
const BIDI_CONTROL_CLASS = `[${BIDI_CONTROL_CODE_POINTS.map(
  (cp) => `\\u${cp.toString(16).padStart(4, "0")}`
).join("")}]`;

/**
 * A fresh regex per call, not one module-level literal with the `g` flag.
 * A global regex carries `lastIndex`; String.prototype.replace resets it but
 * .test() does not, which would make a second identical call disagree with the
 * first. These strings are grid-cell sized, so the allocation is not worth
 * reasoning about.
 */
const bidiControlRe = () => new RegExp(BIDI_CONTROL_CLASS, "g");

/**
 * Strip bidi controls only. For the row-action labels and the confirmation
 * dialog, which need the text readable but not whitespace-collapsed.
 */
export const stripBidiControls = (value?: string | null): string =>
  value == null ? "" : String(value).replace(bidiControlRe(), "");

/**
 * True when `value` contains at least one bidi control. Used by the check
 * script and by nothing in the render path, which strips unconditionally.
 */
export const hasBidiControls = (value?: string | null): boolean =>
  value == null ? false : bidiControlRe().test(String(value));

/**
 * Grid-cell text: bidi controls removed, then whitespace collapsed.
 *
 * Order matters. Collapsing first would leave a control character adjacent to a
 * space and, worse, would let a control sitting between two runs of whitespace
 * survive into the cell. Strip, then collapse.
 */
export const gridCellText = (value?: string | null): string =>
  stripBidiControls(value).replace(/\s+/g, " ").trim();
