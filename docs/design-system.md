# DIU SEC Design System

Regenerated 2026-11-27 with UI/UX Pro Max (`search.py "blue university engineering student club community website bold editorial vibrant" --design-system -p "DIU SEC" --format markdown --variance 6 --motion 5 --density 4`; palette from `search.py "blue indigo oceanic trustworthy academic club palette" -d color`, result 3 "Conference / Symposium Landing Page"; fonts from `-d typography`, result 4 "Bold Statement"). Stack guidance: `--stack shadcn` (CSS variables + `@theme inline`, `.dark` overrides) and `--stack nextjs` (App Router, Metadata API).

**User override (2026-11-27):** the generated sports-club palette was red; the human partner asked for a bluish palette. Navy + vivid blue replaces red everywhere, with red kept only for destructive actions.

## Direction

- **Pattern:** Hero-centric, vibrant & block-based — bold, energetic, geometric blocks, high contrast. Fits a student club; keep contrast and focus rings explicit.
- **Type:** Bebas Neue for large display headings only; Source Sans 3 for body; Geist Mono for eyebrow labels and numeric metadata. Aggressive scale: 32px+ section titles, 48px+ hero display.
- **Motion:** 200–350ms transitions, 60ms stagger on card grids; `prefers-reduced-motion: reduce` removes non-essential motion.
- **Spacing:** 4/8px rhythm, 48px+ between major sections.

## Palette (light — bluish)

| Token | Value | Contrast note |
|---|---|---|
| `--background` | `#F8FAFC` | Slate-50 canvas |
| `--foreground` | `#0F172A` | 17.06:1 on canvas |
| `--card` / `--card-foreground` | `#FFFFFF` / `#0F172A` | — |
| `--primary` / `--primary-foreground` | `#1E3A5F` / `#FFFFFF` | 11.50:1 |
| `--secondary` / `--secondary-foreground` | `#2563EB` / `#FFFFFF` | 5.17:1 |
| `--accent` / `--accent-foreground` | `#2563EB` / `#FFFFFF` | 5.17:1 |
| `--muted` / `--muted-foreground` | `#E9EEF5` / `#475569` | 7.24:1 on canvas |
| `--border` / `--input` / `--ring` | `#CBD5E1` / `#CBD5E1` / `#1E3A5F` | — |
| `--destructive` / `--destructive-foreground` | `#DC2626` / `#FFFFFF` | Semantic red, 4.83:1 |
| chart 1–5 | `#1E3A5F`, `#2563EB`, `#3B82F6`, `#0EA5E9`, `#64748B` | Navy-to-cyan ramp |

## Palette (dark — night blue)

`--background: #0F172A`, `--foreground: #F8FAFC`, `--card/popover: #192134`, `--primary: #60A5FA` with `--primary-foreground: #0F172A` (7.02:1), `--secondary: #2563EB` with white text (5.17:1), `--accent: #60A5FA` with dark text, `--muted: #192134`, `--muted-foreground: #94A3B8` (6.96:1), `--border/input: #334155`, `--ring: #60A5FA`, chart ramp `#60A5FA`, `#3B82F6`, `#38BDF8`, `#818CF8`, `#94A3B8`.

## Type scale and utilities

- `.display-title` — Bebas Neue, uppercase, tight tracking, `text-5xl sm:text-7xl`; hero only.
- `.section-title` — Bebas Neue, `text-3xl sm:text-4xl`, wide tracking; page/section headings.
- `.eyebrow` — Geist Mono, uppercase, `text-xs`, `tracking-[0.2em]`, primary colour.
- `.lead-text` — Source Sans 3, `text-lg sm:text-xl`, muted foreground, max 65ch.
- `.stat-value` — Bebas Neue, `text-4xl sm:text-5xl`, tabular numerals.
- `.rise-in` — shared 350ms fade-up with reduced-motion opt-out; used by public heroes and the admin dashboard.
- `.pill` — small uppercase metadata chip; `.card-lift` — hover/focus elevation; `.dot-grid`, `.hero-surface` and `.admin-banner` — decorative token-based patterns.

## Rules for every page

1. Use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`) — no hard-coded hex in components.
2. Mobile first (≥360px): single column, then `md:`/`lg:` grids; gutters grow at breakpoints.
3. Keyboard: skip link on shells, visible focus ring from `--ring`, no keyboard trap in the mobile nav.
4. Icons: Lucide SVG only, `aria-hidden` when beside visible text, accessible name when standalone.
5. Motion: 200–350ms, `motion-reduce:transition-none`, no auto-playing media. The home hero stays static so the LCP text paints immediately; `.rise-in` is used on the sections below it.
6. Error/empty/loading states use the same tokens and keep text ≥4.5:1 contrast.
7. Admin shell and dashboard use the shared type scale and patterns; no separate red theme.

## Admin shell & dashboard (A-01)

- The header and dashboard title use `.admin-banner`: a token-coloured dot grid plus a soft primary radial glow. Patterns are CSS backgrounds only, never content.
- The sidebar brand block reuses `.dot-grid`; active links get a primary tint and a left accent bar instead of a solid fill, so the label stays readable in both themes.
- Metric cards use `.stat-value`, `.card-lift` and `.rise-in` (350ms fade-up, 60ms stagger). `.rise-in` uses `animation-fill-mode: backwards` so hover lift still works, and is disabled under reduced motion.

## Anti-patterns

Static, lifeless pages; low-contrast gray text; emoji icons; hard-coded colours; focus rings removed; motion that ignores reduced-motion; red accents outside destructive actions.
