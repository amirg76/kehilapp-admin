// Fails when a RAW Unicode bidi control character appears in src/, scripts/,
// .github/ or a root-level text file (or in the paths given on the command line).
//
//   npm run no-raw-bidi      (or: node scripts/no-raw-bidi.mjs [path ...])
//
// WHY. These characters are invisible. A U+202E (RIGHT-TO-LEFT OVERRIDE) pasted
// into a comment or a string literal cannot be seen in an editor, counted in a
// diff or found by eye in a code review — and this repo has had exactly that:
// the regex in src/utils/plainText.ts used to hold twelve of them as literals,
// and a comment in the same file still carried two (ALM, LRM) when this check
// was written. A control character in a comment is harmless to the program and
// corrosive to review (Trojan-Source-style reordering of what a reader sees);
// one in a string literal is a bug that nothing else in the toolchain reports
// (eslint's no-irregular-whitespace does not cover them). So: the policy is
// that the characters are written as `\uXXXX` escapes or named, never raw, and
// this is what enforces it.
//
// WHAT IT SCANS. Every text file (by extension) under the default roots, or
// under the paths given on the command line, read as UTF-8. The set is the twelve Bidi_Control code points — the
// same list src/utils/plainText.ts strips from member text — built here with
// String.fromCodePoint so that this file, too, contains no raw control
// character. Output is English on purpose: raw terminal output mangles Hebrew.
//
// Exit 0 = clean. Exit 1 = at least one hit, each printed as
//   path:line:col  U+XXXX NAME
// Exit 2 = a path given on the command line does not exist.

import { lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

// Code point -> the short name the Unicode standard uses for it.
const BIDI_CONTROLS = new Map([
  [0x061c, "ALM (ARABIC LETTER MARK)"],
  [0x200e, "LRM (LEFT-TO-RIGHT MARK)"],
  [0x200f, "RLM (RIGHT-TO-LEFT MARK)"],
  [0x202a, "LRE (LEFT-TO-RIGHT EMBEDDING)"],
  [0x202b, "RLE (RIGHT-TO-LEFT EMBEDDING)"],
  [0x202c, "PDF (POP DIRECTIONAL FORMATTING)"],
  [0x202d, "LRO (LEFT-TO-RIGHT OVERRIDE)"],
  [0x202e, "RLO (RIGHT-TO-LEFT OVERRIDE)"],
  [0x2066, "LRI (LEFT-TO-RIGHT ISOLATE)"],
  [0x2067, "RLI (RIGHT-TO-LEFT ISOLATE)"],
  [0x2068, "FSI (FIRST STRONG ISOLATE)"],
  [0x2069, "PDI (POP DIRECTIONAL ISOLATE)"],
]);

// Built from the code points, not typed: this file must pass its own check.
const CONTROL_RE = new RegExp(
  `[${[...BIDI_CONTROLS.keys()].map((cp) => String.fromCodePoint(cp)).join("")}]`,
  "gu"
);

const hex = (n) => `U+${n.toString(16).toUpperCase().padStart(4, "0")}`;

// Text files only: an image's bytes can decode to one of these code points by
// accident. Everything a reviewer reads as text is here; add to it, do not
// drop the filter.
const TEXT_EXTENSIONS = new Set([
  ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".css", ".html", ".json",
  ".md", ".yml", ".yaml", ".svg", ".txt",
]);
const isText = (path) => TEXT_EXTENSIONS.has(extname(path).toLowerCase());

// lstat, not stat: a symbolic link is skipped rather than followed, so a link
// pointing back up the tree cannot keep the CI job walking until its timeout.
function* walk(path) {
  const st = lstatSync(path);
  if (st.isSymbolicLink()) return;
  if (st.isDirectory()) {
    if (basename(path) === "node_modules") return;
    for (const name of readdirSync(path).sort()) yield* walk(join(path, name));
  } else if (st.isFile() && isText(path)) {
    yield path;
  }
}

// Default scope: everything a pull request can change that a reviewer reads as
// text. A scan that listed only src/ let a U+202E in README.md through (gate,
// 7.10.2026). Root files are named one by one: node_modules and dist are not
// walked, and a root-level file is a file, not a tree.
const roots = process.argv.slice(2);
if (roots.length === 0) {
  roots.push(join(REPO_ROOT, "src"), join(REPO_ROOT, "scripts"), join(REPO_ROOT, ".github"));
  for (const name of readdirSync(REPO_ROOT).sort()) {
    const full = join(REPO_ROOT, name);
    if (lstatSync(full).isFile() && isText(full)) roots.push(full);
  }
}

let filesScanned = 0;
let hits = 0;

for (const root of roots) {
  try {
    statSync(root);
  } catch {
    console.error(`no such path: ${root}`);
    process.exit(2);
  }
  for (const file of walk(root)) {
    filesScanned += 1;
    const text = readFileSync(file, "utf8");
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      for (const match of lines[i].matchAll(CONTROL_RE)) {
        hits += 1;
        const cp = match[0].codePointAt(0);
        console.log(
          `${relative(REPO_ROOT, file)}:${i + 1}:${match.index + 1}  ${hex(cp)} ${BIDI_CONTROLS.get(cp)}`
        );
      }
    }
  }
}

console.log(
  `no-raw-bidi: ${filesScanned} files scanned, ${hits} raw bidi control character(s) found`
);
// A scan of nothing is not a clean scan: a renamed folder or a wrong root must
// fail loudly, not pass green.
if (filesScanned === 0) {
  console.error("no-raw-bidi: scanned 0 files — wrong root?");
  process.exit(2);
}
process.exit(hits === 0 ? 0 : 1);
