---
name: ServiceFlow (working) — Frontend
description: Dark, monochrome, Geist-set repair-service interface; compact field-instrument foundation awaiting brand identity.
colors:
  carbon: "oklch(0.145 0 0)"
  lift: "oklch(0.205 0 0)"
  wash: "oklch(0.269 0 0)"
  porcelain: "oklch(0.922 0 0)"
  on-porcelain: "oklch(0.205 0 0)"
  text: "oklch(0.985 0 0)"
  text-muted: "oklch(0.708 0 0)"
  hairline: "oklch(1 0 0 / 10%)"
  field-stroke: "oklch(1 0 0 / 15%)"
  focus-ring: "oklch(0.556 0 0)"
  alarm: "oklch(0.704 0.191 22.216)"
typography:
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
components:
  button-primary:
    backgroundColor: "{colors.porcelain}"
    textColor: "{colors.on-porcelain}"
    rounded: "{rounded.lg}"
    height: "2rem"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "oklch(0.922 0 0 / 80%)"
---

# Design System: ServiceFlow (working) — Frontend

## Overview

**Creative North Star: "The Calibrated Instrument."**

ServiceFlow's interface today is a deliberately bare, dark, monochrome workshop console:
low-chroma carbon surfaces separated by hairline strokes and faint washes, a single
Geist voice, and one chroma-bearing note reserved for failure. It reads like the control
surface of a piece of shop equipment — quiet, precise, and built to be used by hands
that are busy with the actual machine. That is a *foundation, not a finished identity*:
no brand accent, logo system, or expressive color has been committed yet, and this file
should not be read as if it had.

The character it should keep and grow is the compact field instrument. Technicians
create and advance service orders at the point of service, often on a phone in their
hand. That means high-contrast legibility, tight control rhythm, minimal decoration,
and every pixel justified by scanning or tapping speed. Density is a feature; noise is a
bug. When a brand color eventually lands, it should behave like a calibrated reading on
an instrument — precise, rare, and meaningful — not wallpaper.

Light-mode tokens exist in `src/main.css` but the app is pinned dark (`<html class="dark">`
in `index.html`); treat dark as the operative scheme and the light set as dormant until a
deliberate product decision flips it.

**Key Characteristics:**
- Forced-dark, achromatic neutral surfaces (OKLCH chroma 0 except alarm).
- Single type family — Geist Variable — for everything.
- Flat, hairline-separated layers; depth via value steps, not shadows.
- Compact controls (2rem default height) tuned for dense field work.
- Chroma reserved for destructive/error states only, until brand identity lands.

## Colors

A restrained, near-black neutral ramp with warm-light foregrounds and 10–15% white
strokes — utility equipment, not editorial warmth. All values are canonical OKLCH and
map to the shadcn tokens in `src/main.css`.

### Primary
- **Porcelain** (`oklch(0.922 0 0)`, `--primary` dark): near-white button/emphasis
  surfaces; the "lit" control on a dark console. Text on it uses **On-Porcelain**
  (`oklch(0.205 0 0)`).
- **On-Porcelain** (`oklch(0.205 0 0)`, `--primary-foreground` dark): near-black ink for
  text/icons on porcelain.

### Neutral
- **Carbon** (`oklch(0.145 0 0)`, `--background`): app canvas.
- **Lift** (`oklch(0.205 0 0)`, `--card`/`--popover`/`--sidebar`): raised surfaces —
  cards, popovers, the app shell's side region.
- **Wash** (`oklch(0.269 0 0)`, `--muted`/`--accent`/`--secondary`): soft fills — hover
  states, selected chips, secondary buttons.
- **Text** (`oklch(0.985 0 0)`, `--foreground`): primary text.
- **Text Muted** (`oklch(0.708 0 0)`, `--muted-foreground`): secondary/helper text,
  placeholders, disabled cues.
- **Hairline** (`oklch(1 0 0 / 10%)`, `--border`): default borders/dividers.
- **Field Stroke** (`oklch(1 0 0 / 15%)`, `--input`): input outlines, slightly brighter
  than hairline.

### Tertiary
- **Alarm** (`oklch(0.704 0.191 22.216)`, `--destructive` dark): the only chroma-bearing
  token. Destruction, errors, cancellation.

### Named Rules
**The Calibration Rule.** Chroma is a calibrated reading: only Alarm may carry hue until
brand identity is decided. Nothing decorative gets color while the foundation is
monochrome.
**The Hairline Rule.** Separate surfaces with 10% white strokes and value steps — never
heavy borders and never shadows (see Elevation).
**The Dark-By-Default Rule.** The app ships dark (`html.dark`). Never write styles that
assume light mode; the light token block is dormant, not a co-equal theme.

## Typography

**Display Font:** none committed — every role uses the single body face.
**Body Font:** Geist Variable (`@fontsource-variable/geist`) with `ui-sans-serif,
system-ui, sans-serif` fallback.
**Label/Mono Font:** none. Do not introduce a second family for labels or code.

**Character:** Geist Variable is a tight, technical-grotesque face — even, slightly
compact, and legible at small sizes. It suits the instrument metaphor and carries the
whole hierarchy alone until a brand type pairing is decided.

### Hierarchy
The scale is not yet committed (no product screens exist). Observed running values:
- **Default body/control text:** 0.875rem, weight 500 for controls (`font-medium`).
- **Small text/labels:** 0.75rem (`text-xs`); secondary text 0.8rem.
- Sizes beyond these are uncommitted; establish the full scale when the first product
  surface ships, staying within Geist Variable's weights.

### Named Rules
**The One-Voice Rule.** One typeface, one hierarchy until brand work. A second font is a
brand commitment, not an implementation detail.

## Layout

No committed grid or container model yet — the authenticated shell is an empty `<main>`.
Directional invariants from the compact-field-instrument character:

- **Control density:** default control height 2rem (`h-8`); compact 1.5–1.75rem for
  small (xs/sm/icon); primary mobile actions may step up to 2.25rem (`lg`, `h-9`) to
  favor thumbs.
- **Rhythm:** Tailwind v4 default spacing scale is the source; no custom spacing tokens.
- **Responsive:** Tailwind defaults apply (`sm 640 / md 768 / lg 1024 / xl 1280`). The
  operational screens must prove themselves mobile-first per PRODUCT.md; breakpoints
  will be refined when those surfaces exist.

## Elevation & Depth

Flat by default. Depth is conveyed by **tonal value stepping** between Carbon (0.145),
Lift (0.205), and Wash (0.269) plus 10% hairline strokes — no shadow vocabulary is
defined in the tokens, and none should be added for resting surfaces. State is expressed
through color shift and focus treatment, not lifting.

### Shadow Vocabulary
- None committed. If elevation is ever needed for overlays, define it then rather than
  importing a default.

### Named Rules
**The Flat-By-Default Rule.** Surfaces rest flat. Feedback moves through color and
focus rings, so density and scanability stay intact.

## Shapes

A gently rounded, cohesive control language scaled from a 0.625rem base (`--radius`):

- **Radius scale (computed from `--radius`):** sm 0.375rem · md 0.5rem · lg 0.625rem ·
  xl 0.875rem · 2xl 1.125rem · 3xl 1.375rem · 4xl 1.625rem.
- Buttons use lg (0.625rem) at default size, clamping to md (0.5rem) on xs/sm/icon
  sizes so small controls stay crisp.
- No pill/squircle forms, no hard 90° clipping, no drop-cap or circular silhouette
  language is committed yet.

## Components

The component library is a scaffold: one documented primitive (Button) plus external
Clerk-hosted auth screens. Details below; full hover/focus CSS lives in the sidecar.

### Buttons
- **Shape:** gently rounded (0.625rem default; 0.5rem on xs/sm/icon), 1px transparent
  border, `transition-all` with `active` translate-down 1px for press feedback.
- **Primary:** porcelain fill, on-porcelain text (the lit control).
- **Hover:** primary softens to 80% opacity; outline/ghost lift to Wash fills.
- **Focus-visible:** 3px ring at 50% (`ring-ring/50`) with the border shifting to
  `--ring`; destructive focus uses the alarm hue at reduced alpha.
- **Variants:** default · outline (hairline border, background fill, hover Wash) ·
  secondary (Wash fill) · ghost (fill on hover only) · destructive (10% alarm fill,
  alarm text, deepens on hover) · link (underlined porcelain text).
- **Destructive/disabled:** disabled is 50% opacity, no pointer events.

### Inputs / Fields
- Not yet implemented in app code (auth forms are Clerk-themed). When built: flat
  Carbon/Lift fill, **Field Stroke** outline (`oklch(1 0 0 / 15%)`), 0.5rem radius,
  focus = ring treatment matching buttons. Inherit base-ui nova conventions already
  imported in `shadcn/tailwind.css`.

### Cards / Navigation
- Not yet implemented. Follow Color/Elevation rules above (Lift fills, hairline
  borders, no resting shadows) when they arrive.

## Do's and Don'ts

### Do:
- **Do** pull every color/radius from the token set in `src/main.css` — never raw hex
  (the single exception is the uncommitted brand/document accent `#008CFF`, which is
  for backend order-PDFs/emails, not app UI).
- **Do** express hierarchy and grouping with value steps (Carbon → Lift → Wash) and
  10% hairline strokes.
- **Do** keep controls compact (2rem default) and give primary mobile actions the lg
  (2.25rem) step for thumb targets.
- **Do** use the destructive variant (Alarm) for every cancel/error path so the only
  chroma always means "stop".
- **Do** write every interaction with a visible `:focus-visible` ring.

### Don't:
- **Don't** introduce an accent color anywhere in the app — no brand hue is committed.
- **Don't** assume light mode; the app is pinned dark and the light tokens are dormant.
- **Don't** use light-optimized Tailwind utilities (e.g. `bg-red-50`, `border-red-200`
  seen in the current error box) that read wrongly on the carbon field — use the Alarm
  token instead.
- **Don't** add a second typeface or a mono/label face until brand work decides it.
- **Don't** add resting shadows; keep the system flat and stroke-separated.
- **Don't** treat the current starter primaries as a finished identity — document and
  build against them, but leave the accent lane open for the brand decision.
