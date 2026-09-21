// Standalone safety check for src/utils/plainText.ts.
//
//   npm run plain-text-check      (or: node scripts/plain-text-check.mjs)
//
// It exits non-zero on any failure. Output is English on purpose: raw terminal
// output mangles Hebrew.
//
// HOW AN .mjs SCRIPT IMPORTS A .ts MODULE. Directly — `import ... from
// "../src/utils/plainText.ts"`. Node has stripped TypeScript types from .ts
// files on its own since v22.18/v23, with no flag and no loader; this repo's
// node is v24.13.0 (`node --version`), and the import was run before this
// script was written to confirm it resolves rather than assumed. plainText.ts
// contains only erasable syntax (type annotations on exported consts), which is
// all type-stripping supports — no enums, no namespaces, no parameter
// properties. There is no test runner in this repo and no transpile step
// outside vite, so this is the whole apparatus: the real module, not a copy of
// it rewritten in JS, which is the version that could pass while the shipped
// one is broken.
//
// EVERY hostile character below is written with String.fromCodePoint and never
// pasted in as a literal. Two reasons. They are invisible, so a pasted one is
// unreviewable — you cannot see it in a diff and you cannot count them. And an
// earlier agent on this project pasted real invisible characters into source
// files (the regex in this very module used to be twelve of them); eslint's
// no-irregular-whitespace catches only some of those, so the mistake is cheap
// to make and expensive to find. Building them here also means the test names
// can spell out which code point each case is about.
//
// This mirrors kehilapp-front-hardened/scripts/bidi-text-check.mjs case for
// case. The two repos share no code, so this script is what holds the admin
// panel's copy of the list to the same standard.

import {
  BIDI_CONTROL_CODE_POINTS,
  gridCellText,
  hasBidiControls,
  stripBidiControls,
} from "../src/utils/plainText.ts";

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${name}`);
    console.log(`        expected: ${e}`);
    console.log(`        actual:   ${a}`);
  }
}

const cp = (...points) => String.fromCodePoint(...points);
const hex = (n) => `U+${n.toString(16).toUpperCase().padStart(4, "0")}`;

// ---------------------------------------------------------------------------
console.log("--- the exported list IS what the regex is built from ---");

check("the list holds 12 code points", BIDI_CONTROL_CODE_POINTS.length, 12);

// Independent of the module's list: ask node's own Unicode tables. If Unicode
// ever grows a thirteenth Bidi_Control character, this fails and the list has to
// be updated. This is also the assertion that would have caught the U+061C hole
// the resident repo's urlSafety.js shipped with before it was measured.
const fromUnicode = [];
for (let c = 0; c <= 0x10ffff; c += 1) {
  if (/\p{Bidi_Control}/u.test(String.fromCodePoint(c))) fromUnicode.push(c);
}
check(
  "list === node's own \\p{Bidi_Control} set",
  [...BIDI_CONTROL_CODE_POINTS].sort((a, b) => a - b),
  fromUnicode
);

// The point of ITEM A. The array used to be decorative: the regex held pasted
// literals and the array was a hand-kept echo, so the array could say one thing
// while the strip did another and nothing would notice. These two assertions
// are what fails if anyone re-inlines the characters: every listed code point
// must actually be stripped, and nothing outside the list may be.
for (const point of BIDI_CONTROL_CODE_POINTS) {
  check(
    `${hex(point)} in the list is actually stripped`,
    stripBidiControls(`a${cp(point)}b`),
    "ab"
  );
}
check(
  "the module is frozen against accidental mutation",
  Object.isFrozen(BIDI_CONTROL_CODE_POINTS),
  true
);

// ---------------------------------------------------------------------------
console.log("\n--- each of the twelve code points is stripped ---");

for (const point of fromUnicode) {
  // A realistic display name: Hebrew, then the control, then Hebrew.
  check(
    `${hex(point)} removed from a name`,
    stripBidiControls(`דנה${cp(point)}כהן`),
    "דנהכהן"
  );
  check(
    `${hex(point)} detected by hasBidiControls`,
    hasBidiControls(cp(point)),
    true
  );
}

// The specific attack this panel is exposed to, spelled out end to end: the
// name an admin reads in the users grid while deciding to promote or delete.
const RLO = 0x202e;
check(
  `${hex(RLO)} in an admin-facing display name`,
  stripBidiControls(`דנה${cp(RLO)}כהן`),
  "דנהכהן"
);
check(
  `${hex(RLO)} in an email local part (the name fallback source)`,
  gridCellText(`dana${cp(RLO)}liat@demo.example.com`),
  "danaliat@demo.example.com"
);
check(
  "several controls in one string, all removed",
  stripBidiControls(`${cp(0x2066)}a${cp(0x202e)}b${cp(0x061c)}c${cp(0x2069)}`),
  "abc"
);

// ---------------------------------------------------------------------------
console.log("\n--- a name that is ONLY bidi characters ---");

check("lone RLO strips to empty string", stripBidiControls(cp(RLO)), "");
check(
  "lone ALM (U+061C) strips to empty string",
  stripBidiControls(cp(0x061c)),
  ""
);
check(
  "a name of nothing but controls strips to empty string",
  stripBidiControls(fromUnicode.map((p) => cp(p)).join("")),
  ""
);
check("…and gridCellText agrees", gridCellText(cp(RLO)), "");

// ---------------------------------------------------------------------------
console.log("\n--- ORDER: strip before collapsing whitespace ---");

// This is the case that fails if gridCellText collapses first. "a  <RLO>  b"
// has the control sitting between two runs of whitespace; collapsing first
// merges each run to a single space and leaves the control in the cell.
check(
  "control between two runs of whitespace does not survive",
  gridCellText(`a  ${cp(RLO)}  b`),
  "a b"
);
check(
  "…and the result contains no control at all",
  hasBidiControls(gridCellText(`a  ${cp(RLO)}  b`)),
  false
);
check(
  "control surrounded by tabs/newlines",
  gridCellText(`a\t\n${cp(0x202b)}\n\tb`),
  "a b"
);
check(
  "leading and trailing controls plus whitespace are trimmed away",
  gridCellText(`  ${cp(0x200f)} דנה כהן ${cp(0x200e)}  `),
  "דנה כהן"
);

// stripBidiControls must NOT collapse whitespace — the aria-labels and the
// confirmation dialog use it, and only gridCellText is allowed to touch spacing.
check(
  "stripBidiControls leaves whitespace exactly as typed",
  stripBidiControls(`a  ${cp(RLO)}  b`),
  "a    b"
);

// ---------------------------------------------------------------------------
console.log("\n--- ordinary text passes through untouched ---");

const untouched = [
  "דנה כהן",
  "Ordinary English Name",
  "dana.cohen+board@demo.example.com",
  "מפגש Zoom ביום שלישי at 19:00 בחדר האוכל",
  'מחיר: 1,250.50 ש"ח (כולל מע"מ) — 15%!',
  "אמוג'י נשאר: 📌 ✅ 🎉",
  'גרש ׳ וגרשיים ״ עברים',
  "O'Brien-Levi",
];
for (const text of untouched) {
  check(`unchanged ${JSON.stringify(text)}`, stripBidiControls(text), text);
  check(
    `no controls reported in ${JSON.stringify(text)}`,
    hasBidiControls(text),
    false
  );
}

// Near misses: characters that are invisible or exotic but are NOT Bidi_Control
// and must therefore survive. Removing these would be the module quietly
// growing a second, unmeasured policy.
check(
  "zero-width space (U+200B) is not stripped",
  stripBidiControls(`a${cp(0x200b)}b`),
  `a${cp(0x200b)}b`
);
check(
  "zero-width joiner (U+200D) is not stripped",
  stripBidiControls(`a${cp(0x200d)}b`),
  `a${cp(0x200d)}b`
);
check(
  "Hebrew niqqud (U+05B0) is not stripped",
  stripBidiControls(`שָ${cp(0x05b0)}לום`),
  `שָ${cp(0x05b0)}לום`
);
check(
  "U+2065 and U+206A, the code points adjacent to the isolate block, survive",
  stripBidiControls(`${cp(0x2065)}x${cp(0x206a)}`),
  `${cp(0x2065)}x${cp(0x206a)}`
);

// ---------------------------------------------------------------------------
console.log("\n--- empty and missing input ---");

check("undefined -> empty string", stripBidiControls(undefined), "");
check("null -> empty string", stripBidiControls(null), "");
check("empty string -> empty string", stripBidiControls(""), "");
check("undefined via gridCellText -> empty string", gridCellText(undefined), "");
check("null via gridCellText -> empty string", gridCellText(null), "");
check("hasBidiControls(undefined) is false", hasBidiControls(undefined), false);
check("hasBidiControls(null) is false", hasBidiControls(null), false);
// A non-string is coerced, not thrown on: the API sends whatever it sends, and
// a row whose `name` came back as a number must not blank the whole grid.
check("a number is coerced, not thrown on", stripBidiControls(42), "42");

// ---------------------------------------------------------------------------
console.log("\n--- repeated calls are not stateful ---");

// A module-level /g regex would carry lastIndex and make the SECOND identical
// call disagree with the first. plainText.ts builds a fresh instance per call;
// this is what holds it to that.
const sample = `x${cp(RLO)}y`;
check("first hasBidiControls call", hasBidiControls(sample), true);
check("second hasBidiControls call agrees", hasBidiControls(sample), true);
check("third hasBidiControls call agrees", hasBidiControls(sample), true);
check("strip is idempotent", stripBidiControls(stripBidiControls(sample)), "xy");

console.log("");
console.log(`TOTAL: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
