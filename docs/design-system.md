# DIU SEC Design System

Generated 2026-11-27 with UI/UX Pro Max (`search.py "university student engineering club community website" --design-system -p "DIU SEC" --format markdown`). Stack guidance: `--stack shadcn` (CSS variables + `@theme inline`, `.dark` overrides) and `--stack nextjs` (App Router layouts, Metadata API).

## Direction

- **Pattern:** Hero-centric. One primary CTA in the hero plus a sticky-nav CTA; show the next content cue below the fold.
- **Style:** Vibrant & Block-based — bold, energetic, geometric blocks, high contrast. Fits a student club; need to keep contrast and focus rings explicit (style risk is conditional).
- **Type:** Bebas Neue headings, Source Sans 3 body. Impactful headlines, readable body.
- **Motion:** 200–300ms transitions; respect `prefers-reduced-motion` (static hero/CTA).
- **Spacing:** 4/8px rhythm with 48px+ between major sections; 32px+ display type.

## Palette (light)

| Token | Value |
|---|---|
| `--background` | `#FEF2F2` |
| `--foreground` | `#7F1D1D` |
| `--card` / `--card-foreground` | `#FFFFFF` / `#7F1D1D` |
| `--primary` / `--primary-foreground` | `#DC2626` / `#FFFFFF` |
| `--secondary` / `--secondary-foreground` | `#EF4444` / `#000000` |
| `--muted` / `--muted-foreground` | `#F0EDF1` / `#475569` |
| `--accent` / `--accent-foreground` | `#DC2626` / `#FFFFFF` |
| `--border` / `--input` / `--ring` | `#FECACA` / `#FECACA` / `#DC2626` |
| `--destructive` | `#DC2626` |
| chart 1–5 | `#DC2626`, `#F59E0B`, `#EF4444`, `#7F1D1D`, `#475569` |

Dark mode overrides every semantic token under `.dark` with dark red surfaces and light text; dark-mode contrast is checked separately.

## Rules for every page

1. Use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`) — no hard-coded hex in components.
2. Mobile first (≥360px): single column, then `md:`/`lg:` grids; gutters grow at breakpoints.
3. Keyboard: skip link on public shell, visible focus ring from `--ring`, no keyboard trap in the mobile nav.
4. Icons: Lucide SVG only, `aria-hidden` when beside visible text, accessible name when standalone.
5. Motion: 200–300ms, `motion-reduce:transition-none`, no auto-playing media.
6. Error/empty/loading states use the same tokens and keep text ≥4.5:1 contrast.

## Anti-patterns

Static, lifeless pages; low-contrast gray text; emoji icons; hard-coded colors; focus rings removed; motion that ignores reduced-motion.
