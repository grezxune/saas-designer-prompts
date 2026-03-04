import { pickOne } from "./random";
import type { LayoutVariantPlan, Mode } from "./redesign-types";

const MARKETING_HEADER_PATTERNS = [
  "floating-island",
  "static-full-width",
  "sticky-full-width",
  "offset-rail",
  "minimal-top-bar",
] as const;
const HERO_ADJACENT_PATTERNS = [
  "feature-tiles",
  "proof-metrics-band",
  "interactive-demo-strip",
  "manifesto-pullquote",
  "use-case-marquee",
  "timeline-intro",
] as const;
const SECTION_ORDER_TEMPLATES = [
  "hero-postHero-features-philosophy-protocol-conversion-footer",
  "hero-postHero-philosophy-features-protocol-conversion-footer",
  "hero-postHero-features-protocol-philosophy-conversion-footer",
  "hero-postHero-proof-features-protocol-conversion-footer",
  "hero-postHero-usecases-features-protocol-conversion-footer",
  "hero-postHero-philosophy-protocol-features-conversion-footer",
  "hero-postHero-protocol-features-philosophy-conversion-footer",
  "hero-postHero-story-features-protocol-conversion-footer",
] as const;

const LANDING_VARIANTS = {
  hero: ["immersive-bleed", "split-editorial", "diagonal-band", "center-stage-monolith"],
  features: ["masonry-micro-ui", "alternating-rows", "tabbed-showcase", "stacked-lab-cards"],
  philosophy: ["contrast-manifesto", "timeline-doctrine", "two-column-essay", "quote-wall"],
  protocol: ["sticky-stack", "horizontal-rail", "pinned-chapters", "stepper-lens"],
  conversion: ["single-focus-cta", "dual-path-cta", "offer-grid", "case-study-cta"],
  footer: ["rounded-deep-grid", "minimal-inline", "split-newsletter-legal", "stacked-brand-ops"],
} as const;

const APP_HEADERS = [
  "app-island",
  "app-static-full-width",
  "app-sticky-full-width",
  "app-contextual-subnav",
  "app-compact-toolbar",
] as const;
const DASHBOARD_TEMPLATES = [
  "kpi-ribbon-first",
  "operational-command-center",
  "narrative-insights",
  "activity-river",
] as const;
const ENTITY_LIST_TEMPLATES = ["table-dominant", "kanban-split", "filter-board", "timeline-list-hybrid"] as const;
const ENTITY_DETAIL_TEMPLATES = [
  "summary-hero-plus-tabs",
  "split-inspector",
  "document-ledger",
  "timeline-focus",
] as const;
const SETTINGS_TEMPLATES = [
  "tabbed-pill-sections",
  "left-nav-form-panels",
  "stacked-cards",
  "two-pane-preferences",
] as const;
const BILLING_TEMPLATES = [
  "plan-grid-plus-usage",
  "invoice-ledger-first",
  "tier-comparison-spotlight",
  "hybrid-plan-history",
] as const;

/**
 * Creates a unique layout variant plan and signature for the current run.
 */
export function createUniqueLayoutVariantPlan(
  mode: Mode,
  rng: () => number,
  usedLayoutSignatures: Set<string>,
): { layoutVariantPlan: LayoutVariantPlan; layoutSignature: string } {
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const layoutVariantPlan = createLayoutVariantPlan(mode, rng);
    const layoutSignature = makeLayoutSignature(layoutVariantPlan);
    if (!usedLayoutSignatures.has(layoutSignature)) {
      return { layoutVariantPlan, layoutSignature };
    }
  }
  throw new Error("Failed to generate unique layout variant plan after 2000 attempts.");
}

function createLayoutVariantPlan(mode: Mode, rng: () => number): LayoutVariantPlan {
  const landingSectionVariants = {
    hero: pickOne(LANDING_VARIANTS.hero, rng),
    features: pickOne(LANDING_VARIANTS.features, rng),
    philosophy: pickOne(LANDING_VARIANTS.philosophy, rng),
    protocol: pickOne(LANDING_VARIANTS.protocol, rng),
    conversion: pickOne(LANDING_VARIANTS.conversion, rng),
    footer: pickOne(LANDING_VARIANTS.footer, rng),
  };

  const base: LayoutVariantPlan = {
    marketingHeaderPattern: pickOne(MARKETING_HEADER_PATTERNS, rng),
    heroAdjacentPattern: pickOne(HERO_ADJACENT_PATTERNS, rng),
    sectionOrderTemplate: pickOne(SECTION_ORDER_TEMPLATES, rng),
    landingSectionVariants,
  };

  if (mode === "platform") {
    base.appPageVariants = {
      appHeaderPattern: pickOne(APP_HEADERS, rng),
      dashboardTemplate: pickOne(DASHBOARD_TEMPLATES, rng),
      entityListTemplate: pickOne(ENTITY_LIST_TEMPLATES, rng),
      entityDetailTemplate: pickOne(ENTITY_DETAIL_TEMPLATES, rng),
      settingsTemplate: pickOne(SETTINGS_TEMPLATES, rng),
      billingTemplate: pickOne(BILLING_TEMPLATES, rng),
    };
  }

  return base;
}

function makeLayoutSignature(plan: LayoutVariantPlan): string {
  const app = plan.appPageVariants
    ? `${plan.appPageVariants.appHeaderPattern}|${plan.appPageVariants.dashboardTemplate}|${plan.appPageVariants.entityListTemplate}|${plan.appPageVariants.entityDetailTemplate}|${plan.appPageVariants.settingsTemplate}|${plan.appPageVariants.billingTemplate}`
    : "landing-only";

  return [
    plan.marketingHeaderPattern,
    plan.heroAdjacentPattern,
    plan.sectionOrderTemplate,
    plan.landingSectionVariants.hero,
    plan.landingSectionVariants.features,
    plan.landingSectionVariants.philosophy,
    plan.landingSectionVariants.protocol,
    plan.landingSectionVariants.conversion,
    plan.landingSectionVariants.footer,
    app,
  ].join("|");
}
