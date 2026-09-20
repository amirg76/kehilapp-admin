import createCache from "@emotion/cache";
// `stylis` is pinned to the EXACT 4.2.0 in package.json, against the `^` every
// other dependency there uses. @emotion/cache depends on `stylis: "4.2.0"`
// exactly; a caret here resolved to 4.4.0 and npm installed a SECOND copy, so
// the `prefixer` handed to emotion's serialiser came from a different stylis
// build than the serialiser itself. One copy, deliberately.
//
// The pin alone was not enough, which is why package.json also carries
// `"overrides": { "stylis": "4.2.0" }`. The pin only holds while @emotion/cache
// keeps asking for that exact version, and its own range here is a caret — so a
// future `npm install` could move it to a release that pins a different stylis
// and quietly reintroduce the second copy. The override states the invariant
// that actually matters (ONE stylis in the tree) rather than the coincidence
// that currently produces it. `npm ls stylis` prints "overridden" and shows
// every other reference deduped; that output is the check if this is ever
// doubted. If a future @emotion/cache genuinely needs a newer stylis, the
// install will say so loudly here instead of silently splitting the tree.
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

/**
 * The emotion cache every MUI component in this app renders through.
 *
 * `theme.direction = "rtl"` tells MUI's JavaScript which way the app runs, but
 * the CSS emotion emits for MUI's own components is written with PHYSICAL
 * properties — `margin-right: 8px`, `right: -12px`, `transform-origin: top left`
 * — and nothing in the DOM rewrites those. This cache does: `rtlPlugin` runs
 * cssjanus over every declaration emotion is about to emit and mirrors the
 * physical ones. It is the library's supported answer, and it replaces the
 * per-slot corrections that src/theme/index.ts used to carry by hand.
 *
 * `prefixer` is listed first and is not optional: passing `stylisPlugins` at all
 * REPLACES emotion's default plugin list, and the prefixer is what was in it.
 * Omitting it silently drops vendor prefixes from everything MUI renders.
 *
 * Scope note: this only reaches CSS emotion generates — MUI core, MUI X and any
 * `sx`/`styled` in this app. The app's own SCSS is compiled by sass and is not
 * touched; those stylesheets were written with logical properties by hand.
 *
 * Trap this leaves behind: the plugin cannot tell a mirror-me property from a
 * leave-me-alone one. A `box-shadow` x-offset or a `linear-gradient` angle in a
 * `styled`/`sx` block WILL be flipped. This app keeps all of those in SCSS
 * (navbar.scss, login.scss, global.scss, mixins.scss) and the theme declares
 * none, so there is nothing here for it to get wrong today — but a shadow or
 * gradient added to the theme later needs `/* @noflip *\/` on it.
 */
export const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});
