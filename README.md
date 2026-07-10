# sara h. hammami — the site is a book

A static portfolio built with **Astro 5 + TypeScript**. Cream paper, book
furniture (running head, folios, fore-edge, a ribbon bookmark), her
photographs as plates, and her poems in their manuscript setting.

## run it

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve the built site
npm run check      # typecheck (astro check)
```

Deploy `dist/` to any static host (Netlify, Cloudflare Pages, GitHub Pages).
Set the real domain in `astro.config.mjs` (`site:`) when known.

## where things live

```
src/
  content/works/<slug>/index.md   ← a project: frontmatter + statement
  content/works/<slug>/plate-*.jpg← its photographs
  content/works/<slug>/poems/*.txt← its poems (see below)
  poems/*.txt                     ← poems for the published-works reading room
  lib/toc.ts                      ← the book's contents + page numbers
  pages/…                         ← cover/spread, chapter template, reading room, cv
  styles/tokens.css               ← the palette & type (all traced to Sara's materials)
  styles/book.css                 ← the codex furniture
  scripts/codex.ts                ← folio, fore-edge, light-chasing, dialog, smooth scroll
```

## page anatomy — every page is built the same way

1. **Codex chrome** (from `layouts/Codex.astro`, identical everywhere):
   running head, contents dialog (ribbon + fore-edge open it), folio line
   (fixed on desktop, a static footer ≤900px), page-turning (arrows/swipe).
2. **A head**: either a photographic `chapter-hero` (dark or `tone: bright`)
   or a typographic head (`readings-head`, `cv-title`).
3. **A `.book-leaves` flow**: THE shared content container — a one-column
   grid with `grid-template-columns: minmax(0, 1fr)`. That track sizing is
   the site's overflow invariant: no child may ever widen the page.
   Anything wider than the viewport (spatial poems) must scroll inside its
   own element (`pre { overflow-x: auto }`), never pan the page. If a new
   page ever scrolls sideways on a phone, something violated this — check
   for `auto` grid tracks or missing `min-width: 0` before adding hacks.
4. `.turn-page` prev/next links close the flow.

## reading controls

- **← / → arrow keys** (desktop) turn to the previous/next page of the
  book, with a direction-matched page-turn transition. Order: cover →
  contents entries; bounded at both ends. (Touch swipe was tried and
  removed: it conflicts with iOS's native edge-swipe-back and never felt
  smooth — on phones, navigate by the turn-page links or the contents.)
- The **fore-edge** (hairline stack, right edge, desktop) is the book's
  unread pages — it thins as you read, hovering names it, clicking opens
  the contents. The **ribbon** does the same from the running head.
- The **light pool** on dark photographs follows the cursor anywhere in the
  hero (text can't steal it); when the cursor leaves, the light stays where
  it was left. On touch it wanders on its own. Painted once, moved with
  `transform` only, and its loop stops when idle — don't reintroduce
  per-frame gradient/CSS-var painting, that's what caused frame drops.
- Fold-outs (`details`) unfold smoothly where `interpolate-size` is
  supported and call `lenis.resize()` on toggle — without that, Lenis
  clamps scrolling above newly revealed content.

## poems: the txt file IS the layout  ⟵ important

Every poem is one plain-text file rendered inside `<pre>` — whatever
whitespace is in the file is exactly what readers see. **To correct a poem's
formatting** (current files are best-effort transcriptions from Sara's PDFs),
just overwrite the `.txt` file with the true text. No HTML or code changes.

Approximate transcriptions to revisit when Sara sends originals:

- `src/poems/iram-of-the-pillars.txt` (heavy spatial indentation)
- `src/poems/self-portrait-2022.txt` (staircase indentation)
- `src/poems/inshallah-inshallah-inshallah.txt` (mixed alignment)
- `src/content/works/entangled-anemones/poems/anemones-ii.txt`
  (the print overlaps lines by design; the site recreates it with CSS —
  `poem--overprint`)

Poem display modes (set per-poem in the work's `index.md`, or in
`published-works.astro`): `spatial` (exact spacing, scrolls sideways on small
screens), `prose` (wraps within the measure), `overprint` (collapsing lines),
`recipe` (renders inside a fold-out).

## adding a future project

1. Create `src/content/works/<slug>/` with `index.md`, images, `poems/`.
2. Copy the frontmatter shape from an existing project (title, year, media,
   `folioStart`/`folioEnd`, cover, `leaves:` — an ordered list of plates,
   poems, and notes).
3. Add the entry to `src/lib/toc.ts` and bump `TOTAL_FOLIOS` + the later
   works' folio ranges (a real book would repaginate too).

## known gaps awaiting Sara

- *On Breathing Underwater* is an intentional stub ("these pages are still
  uncut") — replace `uncut: true` with real content when it exists.
- *TEMPORADA DE TORMENTAS* and *Where the Desert Meets the Sea*: texts not in
  the source folder; listed without readers.
- Mixed-language poems (Spanish/Chinese inline) aren't `lang`-tagged word by
  word since poems are plain text; known limitation.
- Journal links could be added to the reading room when Sara confirms URLs.
