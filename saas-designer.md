# SaaS Designer Router

Use this file as the entrypoint only.

## Step 1 (Always)

Load `saas-ux-core-rules.md` first. It is the shared source of truth for UX and styling.

## Step 2 (Pick One Mode)

- If the request is **marketing/landing only**, use `saas-landing-designer.md`.
- If the request is a **full SaaS product** (auth app, dashboard, CRUD, settings, billing, etc.), use `saas-platform-designer.md`.

## Selection Rule

When uncertain, default to `saas-platform-designer.md`.

## Conflict Rule

If any rule conflicts across files, `saas-ux-core-rules.md` wins.
