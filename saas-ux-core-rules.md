# SaaS UX Core Rules (Shared Source of Truth)

## Purpose

This file is the non-negotiable UX and styling baseline for all SaaS prompt variants in this repo.

- `saas-landing-designer.md` = marketing-only execution rules
- `saas-platform-designer.md` = full product execution rules

If any instruction conflicts, this file wins.

---

## Design Direction

- Build cinematic, premium interfaces that feel intentional and product-specific.
- Avoid generic, template-like SaaS output.
- Keep visual language cohesive across marketing and app surfaces.

---

## Shared Aesthetic Presets

Use these preset definitions consistently across all prompt variants.

### Preset A — Organic Tech
- Palette: Moss `#2E4036`, Clay `#CC5833`, Cream `#F2F0E9`, Charcoal `#1A1A1A`
- Typography: Plus Jakarta Sans + Outfit, Cormorant Garamond Italic, IBM Plex Mono
- Image Mood: dark forest, organic textures, moss, ferns, laboratory glassware

### Preset B — Midnight Luxe
- Palette: Obsidian `#0D0D12`, Champagne `#C9A84C`, Ivory `#FAF8F5`, Slate `#2A2A35`
- Typography: Inter, Playfair Display Italic, JetBrains Mono
- Image Mood: dark marble, gold accents, architectural shadows, luxury interiors

### Preset C — Brutalist Signal
- Palette: Paper `#E8E4DD`, Signal Red `#E63B2E`, Off-white `#F5F3EE`, Black `#111111`
- Typography: Space Grotesk, DM Serif Display Italic, Space Mono
- Image Mood: concrete, brutalist architecture, raw materials, industrial

### Preset D — Vapor Clinic
- Palette: Deep Void `#0A0A14`, Plasma `#7B61FF`, Ghost `#F0EFF4`, Graphite `#18181B`
- Typography: Sora, Instrument Serif Italic, Fira Code
- Image Mood: bioluminescence, dark water, neon reflections, microscopy

---

## Shared Visual System

### Texture
- Apply a global CSS noise overlay with inline SVG `<feTurbulence>` at `0.05` opacity.
- Use rounded container language (`rounded-[2rem]` to `rounded-[3rem]`).

### Motion
- Magnetic button hover (`scale(1.03)`, `cubic-bezier(0.25, 0.46, 0.45, 0.94)`).
- Sliding button background layer on hover.
- Subtle hover lift (`translateY(-1px)`) on interactive elements.
- GSAP lifecycle: `gsap.context()` + cleanup via `ctx.revert()`.
- Defaults: `power3.out` entrances, `power2.inOut` morphs.
- Default stagger: `0.08` text, `0.15` cards/containers.

### Accessibility + Responsiveness
- Mobile-first layouts with intentional tablet/desktop breakpoints.
- Keyboard navigable interactive UI with visible focus states.
- Respect reduced-motion preferences.
- Avoid horizontal page scrolling.

---

## Shared Variation Rules

Create a seeded `variationPlan` per build using `brand + purpose + preset + runNonce`.

- `runNonce` is required on every generation attempt (timestamp fragment, increment, or random slug) to avoid lock-in to one repeated output shape.
- Include `noveltyMemory` for at least the last 5 outputs:
  - `featureAnimationArchetypes` (ordered IDs)
  - `protocolAnimationArchetypes` (ordered IDs)
  - `tileGifDescriptors` (short labels)

- Require variable structure/composition across runs.
- Require novelty checks against previous output before finalizing.
- If novelty fails, regenerate variation choices up to 2 times.

### Hard No-Repeat Contract (Required)

- Within a single output, never reuse the same `animationArchetypeId` across feature tiles.
- Within a single output, never reuse the same `animationArchetypeId` across protocol cards.
- Within a single output, never reuse the same tile GIF descriptor.
- Compared to the last 5 outputs in `noveltyMemory`, do not emit:
  - an identical ordered feature archetype list,
  - an identical ordered protocol archetype list, or
  - an identical tile GIF descriptor set.
- Maintain a session-scoped `animationRegistry` of all emitted archetype IDs and GIF descriptors; do not reuse any registered value in the same session.
- If a collision is detected after retries, mutate animation parameters (primitive, tempo, pathing, phase, easing) and re-hash IDs before finalizing.

Minimum novelty axes:
- section order
- hero composition
- component counts
- motion profile
- dominant visual motif
- type treatment
- animation archetype sets (features + protocol)

---

## Shared Technical Baseline

- Framework: Next.js App Router
- Language: TypeScript strict mode
- Styling: Tailwind CSS v4
- Motion: GSAP 3
- Icons: Lucide React
- Package manager: bun
- Fonts: configured in `app/layout.tsx` or `next/font`

---

## Shared Quality Bar

- No placeholders.
- Implement loading, empty, error, success, and disabled states in key UX paths.
- Lint + typecheck before completion.
- Keep copy coherent with the selected brand identity and target user.
