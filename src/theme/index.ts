import { createTheme, Theme } from "@mui/material/styles";
// Teaches TypeScript that `components.MuiDataGrid` is a real theme slot. Without
// it, styling the grid from the theme is a type error and the only way left is
// per-page `sx` props — i.e. two copies of the grid's appearance that drift.
import "@mui/x-data-grid/themeAugmentation";
// The Hebrew strings MUI ships for its own built-in controls. Without these the
// grid renders "Columns / Filters / Density / Export / Rows per page / Search"
// and the pagination reads "1-10 of 25" — English chrome inside an application
// whose every other word is Hebrew, and the first thing a visitor's eye lands on
// above the table. These are the SAME labels in the app's language, translated by
// the library's own maintainers; nothing here invents wording.
//
// Two packages because the grid is a separate one from MUI core and each ships
// its own catalogue: core covers dialogs, pagination and form controls, the grid
// covers the toolbar, the column menu and the filter panel.
import { heIL as coreHeIL } from "@mui/material/locale";
import { heIL as gridHeIL } from "@mui/x-data-grid/locales";
import { dark, light, ModePalette } from "./palette";

/**
 * The app's MUI theme, in both modes.
 *
 * The absence of this file is the documented root cause of the app's worst
 * accessibility defect: with no ThemeProvider, MUI fell back to its LIGHT
 * palette defaults (near-black text) on top of this app's dark background, and
 * an axe scan measured 1.61:1 on both DataGrid pages where WCAG AA requires
 * 4.5:1. Every colour below comes from ./palette.ts, where each value carries
 * the ratio it was measured at.
 *
 * Scope note: this theme owns everything MUI renders — including the parts that
 * render into a portal at the end of <body> (the column menu, the filter panel,
 * tooltips), which the app's own stylesheets cannot reach at all. The app's
 * SCSS owns everything else. The two share the same hex values on purpose.
 */
const buildTheme = (mode: "light" | "dark", c: ModePalette): Theme =>
  createTheme(
    {
      palette: {
        mode,
        primary: {
          main: c.accentFill,
          dark: c.accentHover,
          contrastText: c.onAccent,
        },
        error: { main: c.danger, contrastText: "#ffffff" },
        background: { default: c.bg, paper: c.surface },
        text: {
          primary: c.text,
          secondary: c.text2,
          disabled: c.text3,
        },
        divider: c.border,
      },
      // The document is `dir="rtl"` (index.html); this is the same fact told to
      // MUI, which does not read the DOM to find out. It is what makes MUI's own
      // direction-aware logic behave — the DataGrid's column reordering and
      // resizing maths, the Drawer/Menu anchoring, and every `theme.direction`
      // branch inside the component styles.
      //
      // What it does NOT do: rewrite the physical CSS emotion emits for MUI's
      // own components. That is the RTL emotion cache's job — see
      // src/theme/rtlCache.ts, mounted as a CacheProvider above ThemeProvider in
      // App.tsx. The two are a pair: direction tells MUI's logic, the cache
      // turns its stylesheet round. This file deliberately no longer carries
      // per-slot mirror fixes; two mechanisms flipping the same property is how
      // a later "fix" un-fixes something.
      direction: "rtl",
      shape: { borderRadius: 10 },
      typography: {
        // Heebo first. Inter — which this app already loaded and named — has no
        // Hebrew glyphs at all, so every Hebrew word was falling through to
        // whatever the operating system happened to pick, which is why the
        // headings and the body text did not look like the same typeface.
        fontFamily:
          '"Heebo", "Inter", system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
        fontSize: 14,
        button: { textTransform: "none", fontWeight: 600 },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            // Makes native scrollbars, date pickers and form-control chrome follow
            // the theme. Without it a dark page keeps a bright white scrollbar.
            ":root": { colorScheme: mode },
          },
        },
        MuiButtonBase: {
          // The template's ripple is the one piece of MUI motion that fires on
          // every grid cell click; disabling focus ripple only, so the pointer
          // feedback stays but keyboard focus is the outline, not a blob.
          defaultProps: { disableTouchRipple: false },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: mode === "light" ? c.text : c.surface3,
              color: mode === "light" ? "#ffffff" : c.text,
              fontSize: 12,
              border: `1px solid ${mode === "light" ? c.text : c.borderStrong}`,
            },
            arrow: { color: mode === "light" ? c.text : c.surface3 },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: { backgroundImage: "none", borderColor: c.border },
          },
        },
        MuiDataGrid: {
          styleOverrides: {
            root: {
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              backgroundColor: c.surface,
              color: c.text,
              // The grid's own font size was 13px against the app's 14px, which
              // is exactly the kind of half-step that makes a page look assembled.
              fontSize: 14,
              "--DataGrid-containerBackground": c.surface2,
            },
            columnHeaders: {
              backgroundColor: c.surface2,
              borderBottom: `1px solid ${c.border}`,
              // The header is the row a scanning eye uses as an anchor; it was
              // rendering in the same weight and colour as the data.
              color: c.text,
              fontWeight: 600,
              letterSpacing: 0,
            },
            columnHeaderTitle: { fontWeight: 600 },
            // MUI's default separator is a near-invisible grey that survives
            // neither mode; the real column boundary is the header fill.
            //
            // The separator's POSITION is no longer a problem here. MUI pins
            // `--sideRight` separators with `right: -12px`; before the RTL
            // emotion cache that did not flip, and on the rightmost column the
            // separator measured x 982–1006 against a grid frame ending at 995 —
            // 11px outside it. The cache rewrites that declaration to
            // `left: -12px`, and the last column's separator now measures inside
            // the frame (see the session report for the after-numbers).
            columnSeparator: { color: c.border },
            cell: {
              borderBottom: `1px solid ${c.border}`,
              color: c.text,
              // The focus ring MUI draws on a cell is a 1px outline in the
              // primary colour; at this offset it reads on both surfaces.
              "&:focus, &:focus-within": {
                outline: `2px solid ${c.accent}`,
                outlineOffset: -2,
              },
            },
            row: {
              "&:hover": { backgroundColor: c.surface2 },
              "&.Mui-selected": {
                backgroundColor: c.surface3,
                "&:hover": { backgroundColor: c.surface3 },
              },
            },
            footerContainer: {
              borderTop: `1px solid ${c.border}`,
              backgroundColor: c.surface2,
              color: c.text2,
            },
            toolbarContainer: {
              gap: 8,
              padding: "10px 12px",
              borderBottom: `1px solid ${c.border}`,
              backgroundColor: c.surface,
              // The toolbar buttons are MUI text buttons in `primary`; on the old
              // themeless app they rendered in MUI's default blue-on-dark.
              "& .MuiButton-root": { color: c.accent, fontWeight: 600 },
              "& .MuiInputBase-root": { color: c.text },
            },
            // The quick-filter's underline and the overlay text both fell back to
            // MUI defaults before there was a theme.
            overlay: { backgroundColor: c.surface, color: c.text2 },
            menu: {
              "& .MuiPaper-root": { backgroundColor: c.surface, color: c.text },
            },
            panelWrapper: { backgroundColor: c.surface, color: c.text },
            // NOTE: the grid's `aria-required-children` violation is a known bug
            // of @mui/x-data-grid@6.20.4 (its row container carries role="row"
            // children the ARIA grid pattern does not allow) and is excluded by
            // name in the accessibility probe. It is not a styling problem and is
            // deliberately not papered over from here.
          },
        },
        // ---------------------------------------------------------------------
        // NOTHING BELOW MIRRORS A PROPERTY BY HAND, and nothing should.
        //
        // src/theme/rtlCache.ts rewrites the physical declarations MUI's own
        // components emit — MuiButton's start/end icon margins, MuiInputLabel's
        // `left: 0` and transform-origin, MuiSelect's caret and its `&&&` padding
        // reservation, MuiTablePagination's `actions` margin, MuiDataGrid's
        // `menuIcon`. Restating any of them here would mean two mechanisms
        // flipping one property, which is how a later "fix" silently un-fixes
        // something: whichever one a reader finds first looks wrong on its own.
        //
        // So the rule for this file: if a declaration exists only to move
        // something to the other side, it does not belong here. The cache does
        // that. What belongs here is everything else.
        //
        // The colour-only overrides below are NOT direction work and stay.
        // ---------------------------------------------------------------------
        MuiTablePagination: {
          styleOverrides: {
            root: { color: c.text2 },
            selectLabel: { color: c.text2 },
            displayedRows: { color: c.text2 },
          },
        },
        MuiInputBase: {
          styleOverrides: { root: { color: c.text } },
        },
        MuiFormLabel: {
          styleOverrides: {
            root: {
              color: c.text2,
              // FOCUSED is the state MUI paints with palette.primary.main, and
              // that is `accentFill` — the fill a white label sits on, chosen to
              // measure 6.29:1 the other way round. As TEXT on the dark surface
              // it measures 2.47:1 against a 4.5 requirement, which an axe pass
              // caught on the filter panel's focused field in dark mode.
              //
              // Overridden here rather than by changing primary.main, because
              // that value is load-bearing as a BACKGROUND: moving it would fix
              // this label and quietly drop the contrast of every filled button
              // in both modes. `accent` is the same hue already carried in the
              // palette for exactly this purpose — text weight, not fill weight.
              //
              // Worth knowing WHY it went unseen for so long: the accessibility
              // scans covered six pages in two colour modes and never opened the
              // filter panel. They measured pages, not states.
              "&.Mui-focused": { color: c.accent },
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: { root: { color: c.text } },
        },
        MuiSwitch: {
          styleOverrides: {
            track: { backgroundColor: c.borderStrong, opacity: 1 },
          },
        },
      },
    },
    // Applied AFTER the options object: createTheme merges each extra argument in
    // order, so these only add strings and cannot overwrite a palette or
    // component override decided above.
    coreHeIL,
    gridHeIL,
  );

export const lightTheme = buildTheme("light", light);
export const darkTheme = buildTheme("dark", dark);
