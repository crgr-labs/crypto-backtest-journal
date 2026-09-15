# Frontend Redesign Spec — Light Theme

Handoff spec for re-architecting the UI. Target: a light, elegant, information-dense trading journal, inspired by the two reference screenshots (KPI dashboard with donut/trend charts, and a colorful tag-based trade table) but in a **light** palette instead of dark.

Current app structure (for reference, don't need to change): `src/App.jsx` (tab shell), `src/components/{LogEntryForm,JournalTable,StatsDashboard,Toast,Icons}.jsx`, `src/constants.js` (entry schema), `src/api.js` (backend calls — untouched by this redesign), Tailwind v4 via `@import "tailwindcss"` in `src/index.css`.

## 1. Color system

Define as CSS custom properties + Tailwind v4 `@theme` block in `src/index.css` (replacing the current dark `bg-zinc-950` scheme). Base is neutral slate/white; one indigo accent for actions; semantic colors for outcomes; a fixed rotating palette for tags (strategy/pair) so different values get visually distinct but harmonious chips.

```css
@theme {
  /* Surfaces */
  --color-surface: #ffffff;
  --color-surface-alt: #f8fafc;      /* page background */
  --color-surface-sunken: #f1f5f9;   /* table header, wells */
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;

  /* Text */
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-text-faint: #94a3b8;

  /* Accent (primary actions, active tab, links) */
  --color-accent: #4f46e5;
  --color-accent-hover: #4338ca;
  --color-accent-soft: #eef2ff;

  /* Semantic outcome colors */
  --color-win: #16a34a;
  --color-win-soft: #dcfce7;
  --color-loss: #dc2626;
  --color-loss-soft: #fee2e2;
  --color-breakeven: #d97706;
  --color-breakeven-soft: #fef3c7;

  /* Tag palette (cycle through for strategy/pair chips) */
  --color-tag-1: #6366f1; --color-tag-1-soft: #eef2ff; /* indigo */
  --color-tag-2: #0891b2; --color-tag-2-soft: #ecfeff; /* cyan */
  --color-tag-3: #c026d3; --color-tag-3-soft: #fdf4ff; /* fuchsia */
  --color-tag-4: #ca8a04; --color-tag-4-soft: #fefce8; /* amber */
  --color-tag-5: #059669; --color-tag-5-soft: #ecfdf5; /* emerald */
  --color-tag-6: #e11d48; --color-tag-6-soft: #fff1f2; /* rose */
}

body { background: var(--color-surface-alt); color: var(--color-text); }
```

Tag color assignment: hash the tag string (strategy name or pair) to one of the 6 tag colors deterministically (`charCodeSum(label) % 6`), so the same strategy always gets the same color across the app. Put this helper in `src/lib/tagColor.js`:

```js
const TAG_COLORS = ['tag-1', 'tag-2', 'tag-3', 'tag-4', 'tag-5', 'tag-6']
export function tagColorClass(label) {
  const sum = [...(label || '')].reduce((s, c) => s + c.charCodeAt(0), 0)
  return TAG_COLORS[sum % TAG_COLORS.length]
}
```

Use it as `bg-[var(--color-{class}-soft)] text-[var(--color-{class})]` on chips (or predefine 6 static Tailwind-safe class pairs, since Tailwind can't purge dynamically-built arbitrary values reliably — see note in §4).

## 2. Layout shape

Keep the existing 3-tab shell (`Log Trade` / `Journal` / `Stats`) — no need for a sidebar or router. Restyle it light:

- **Header** (`App.jsx`): white/`surface` background, `border-b border-[var(--color-border)]`, logo mark in a soft indigo tile, app name in `--color-text`, and a persistent **stat strip** to the right (trades count · win rate · net PnL) — same data as today's `summary` memo, just recolored for light backgrounds (green/red text on white, no glow).
- **Tab bar**: segmented control style like today but light — inactive tabs `text-slate-500`, active tab `bg-white shadow-sm border border-[var(--color-border)] text-[var(--color-accent)]` inside a `bg-slate-100` track.
- **Content area**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6`.

## 3. Stats tab — KPI dashboard (inspired by screenshot 1)

Reuse `StatsDashboard.jsx`'s existing computed values (`computeStats`, `groupStats`, `equityPoints`) — only restyle, keep the math.

- **KPI card row** (4 cards, as today): white cards, `border border-[var(--color-border)] rounded-xl shadow-sm p-5`. Replace dark `bg-zinc-900/60` with `bg-white`. Win-rate card gets a small **donut ring** instead of the current linear bar (SVG `<circle>` with `stroke-dasharray` driven by `winRate`, indigo/slate-200 track) to echo screenshot 1's ring.
- **Equity curve** (already built): restyle line/area chart to light — indigo stroke, `fill-[var(--color-accent-soft)]` area, slate-200 gridlines, keep the existing SVG-based implementation.
- **Breakdown tables** (by pair, by strategy): convert the "pair"/"strategy" first column into a colored tag chip (§1/§4) instead of plain text, so it visually matches the journal table.
- Optional (nice-to-have, not required for v1 of this redesign): small horizontal bar list ranking strategies by PnL, similar to screenshot 1's right-hand "Setups" bars — reuses `byStrategy` data already computed.

## 4. Journal tab — trade table (inspired by screenshot 2)

Restyle `JournalTable.jsx`:

- **Filter bar**: keep existing filters (pair, strategy, outcome, date range) but lay out as a single light toolbar: `bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 flex flex-wrap gap-2`, inputs with `border-slate-200` and `focus:ring-[var(--color-accent)]`.
- **Table**: white surface, `divide-y divide-[var(--color-border)]`, header row `bg-[var(--color-surface-sunken)] text-slate-500 text-xs uppercase`, row hover `hover:bg-slate-50`.
- **Outcome badge**: pill using semantic colors — `bg-[var(--color-win-soft)] text-[var(--color-win)]` etc. (replace current `outcomeStyles` map — same shape, new colors).
- **Strategy / Pair columns**: render as tag chips using the 6-color rotation from §1, e.g.:
  ```jsx
  const TAG_CLASSES = {
    'tag-1': 'bg-indigo-50 text-indigo-600',
    'tag-2': 'bg-cyan-50 text-cyan-700',
    'tag-3': 'bg-fuchsia-50 text-fuchsia-600',
    'tag-4': 'bg-amber-50 text-amber-700',
    'tag-5': 'bg-emerald-50 text-emerald-700',
    'tag-6': 'bg-rose-50 text-rose-600',
  }
  ```
  (static Tailwind classes here, not arbitrary values, so Tailwind's scanner picks them up — pass the key from `tagColorClass()` and look up `TAG_CLASSES[key]`.)
- **Chart thumbnail column**: add a small column showing a cropped thumbnail of `chartImageUrl` (e.g. `w-10 h-10 rounded object-cover border border-[var(--color-border)]`) when present, echoing screenshot 2's leading icon column — click still expands the row as today.
- **Expanded row detail**: keep current structure (grid of Detail fields + full chart image + Edit/Delete), just restyle to light surfaces (`bg-slate-50` panel instead of dark).

## 5. Log Trade tab — form

Restyle `LogEntryForm.jsx` fieldsets as light cards: each group (`Trade`, `Levels`, `Setup`, `Outcome`) becomes its own `bg-white border border-[var(--color-border)] rounded-xl p-4` block instead of a plain `<fieldset>`, inputs get `border-slate-200 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]`. Submit button uses `bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]`.

## 6. Toast component

Restyle `Toast.jsx` to light surfaces with colored left border/icon per type (success → win green, error → loss red, info → accent indigo) instead of dark glassy toasts — keep existing show/dismiss logic untouched.

## 7. What NOT to change

- Data model (`constants.js`), `api.js`, Apps Script backend — untouched, this is a pure presentation-layer pass.
- Existing computed logic in `StatsDashboard.jsx` (`computeStats`, `groupStats`, `equityPoints`) and filter logic in `JournalTable.jsx` — reuse, don't rewrite.
- Tab/routing structure in `App.jsx` — stays 3 tabs, no new routes/pages.

## 8. Suggested build order for Gemini

1. Swap the color tokens in `src/index.css` (§1) — this alone will surface every place still hardcoding dark classes, making them easy to find via search for `zinc-9`/`zinc-8`/`zinc-950`.
2. Restyle `App.jsx` shell (header, tab bar, content wrapper).
3. Restyle `JournalTable.jsx` (table, filters, badges, tag chips, thumbnail column).
4. Restyle `StatsDashboard.jsx` (cards, donut, equity curve, breakdown tables with tag chips).
5. Restyle `LogEntryForm.jsx` and `Toast.jsx`.
6. Visual QA pass: verify contrast (text on soft-colored chips should stay readable, aim for WCAG AA), verify the app still works end-to-end (create/edit/delete/filter) since this is styling-only — no behavior should change.
