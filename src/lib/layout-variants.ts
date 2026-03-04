import type { LayoutVariantPlan, Mode } from "./redesign-types";
import { pickRare, type UsageMap } from "./rarity";

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

const LANDING = {
  hero: ["immersive-bleed", "split-editorial", "diagonal-band", "center-stage-monolith"],
  features: ["masonry-micro-ui", "alternating-rows", "tabbed-showcase", "stacked-lab-cards"],
  philosophy: ["contrast-manifesto", "timeline-doctrine", "two-column-essay", "quote-wall"],
  protocol: ["sticky-stack", "horizontal-rail", "pinned-chapters", "stepper-lens"],
  conversion: ["single-focus-cta", "dual-path-cta", "offer-grid", "case-study-cta"],
  footer: ["rounded-deep-grid", "minimal-inline", "split-newsletter-legal", "stacked-brand-ops"],
} as const;

const APP_HEADERS = ["app-island", "app-static-full-width", "app-sticky-full-width", "app-contextual-subnav", "app-compact-toolbar"] as const;
const DASHBOARD = ["kpi-ribbon-first", "operational-command-center", "narrative-insights", "activity-river"] as const;
const ENTITY_LIST = ["table-dominant", "kanban-split", "filter-board", "timeline-list-hybrid"] as const;
const ENTITY_DETAIL = ["summary-hero-plus-tabs", "split-inspector", "document-ledger", "timeline-focus"] as const;
const SETTINGS = ["tabbed-pill-sections", "left-nav-form-panels", "stacked-cards", "two-pane-preferences"] as const;
const BILLING = ["plan-grid-plus-usage", "invoice-ledger-first", "tier-comparison-spotlight", "hybrid-plan-history"] as const;

/**
 * Creates a unique layout variant plan and signature for the current run.
 */
export function createUniqueLayoutVariantPlan(
  mode: Mode,
  rng: () => number,
  usedLayoutSignatures: Set<string>,
  blockedCompositionFingerprints: Set<string>,
  usage: UsageMap,
): { layoutVariantPlan: LayoutVariantPlan; layoutSignature: string; compositionFingerprint: string; tokens: string[] } {
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const layoutVariantPlan = createLayoutVariantPlan(mode, rng, usage);
    const layoutSignature = makeLayoutSignature(layoutVariantPlan);
    const compositionFingerprint = makeCompositionFingerprint(layoutVariantPlan);
    if (!usedLayoutSignatures.has(layoutSignature) && !blockedCompositionFingerprints.has(compositionFingerprint)) {
      return {
        layoutVariantPlan,
        layoutSignature,
        compositionFingerprint,
        tokens: layoutTokens(layoutVariantPlan),
      };
    }
  }
  throw new Error("Failed to generate unique layout variant plan after 2000 attempts.");
}

function createLayoutVariantPlan(mode: Mode, rng: () => number, usage: UsageMap): LayoutVariantPlan {
  const landingSectionVariants = {
    hero: pickRare("layout.hero", LANDING.hero, usage, rng),
    features: pickRare("layout.features", LANDING.features, usage, rng),
    philosophy: pickRare("layout.philosophy", LANDING.philosophy, usage, rng),
    protocol: pickRare("layout.protocol", LANDING.protocol, usage, rng),
    conversion: pickRare("layout.conversion", LANDING.conversion, usage, rng),
    footer: pickRare("layout.footer", LANDING.footer, usage, rng),
  };

  const base: LayoutVariantPlan = {
    marketingHeaderPattern: pickRare("layout.marketingHeader", MARKETING_HEADER_PATTERNS, usage, rng),
    heroAdjacentPattern: pickRare("layout.heroAdjacent", HERO_ADJACENT_PATTERNS, usage, rng),
    sectionOrderTemplate: pickRare("layout.sectionOrder", SECTION_ORDER_TEMPLATES, usage, rng),
    landingSectionVariants,
  };

  if (mode === "platform") {
    base.appPageVariants = {
      appHeaderPattern: pickRare("layout.appHeader", APP_HEADERS, usage, rng),
      dashboardTemplate: pickRare("layout.dashboard", DASHBOARD, usage, rng),
      entityListTemplate: pickRare("layout.entityList", ENTITY_LIST, usage, rng),
      entityDetailTemplate: pickRare("layout.entityDetail", ENTITY_DETAIL, usage, rng),
      settingsTemplate: pickRare("layout.settings", SETTINGS, usage, rng),
      billingTemplate: pickRare("layout.billing", BILLING, usage, rng),
    };
  }

  return base;
}

export function makeLayoutSignature(plan: LayoutVariantPlan): string {
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

export function makeCompositionFingerprint(plan: LayoutVariantPlan): string {
  const parts = plan.sectionOrderTemplate.split("-");
  const firstTwo = parts.slice(2, 4).join("+");
  const dashboard = plan.appPageVariants?.dashboardTemplate ?? "landing";
  return `${plan.marketingHeaderPattern}|${plan.landingSectionVariants.hero}|${firstTwo}|${dashboard}`;
}

export function layoutTokens(plan: LayoutVariantPlan): string[] {
  const tokens = [
    `layout.marketingHeader:${plan.marketingHeaderPattern}`,
    `layout.heroAdjacent:${plan.heroAdjacentPattern}`,
    `layout.sectionOrder:${plan.sectionOrderTemplate}`,
    `layout.hero:${plan.landingSectionVariants.hero}`,
    `layout.features:${plan.landingSectionVariants.features}`,
    `layout.philosophy:${plan.landingSectionVariants.philosophy}`,
    `layout.protocol:${plan.landingSectionVariants.protocol}`,
    `layout.conversion:${plan.landingSectionVariants.conversion}`,
    `layout.footer:${plan.landingSectionVariants.footer}`,
  ];
  if (plan.appPageVariants) {
    tokens.push(
      `layout.appHeader:${plan.appPageVariants.appHeaderPattern}`,
      `layout.dashboard:${plan.appPageVariants.dashboardTemplate}`,
      `layout.entityList:${plan.appPageVariants.entityListTemplate}`,
      `layout.entityDetail:${plan.appPageVariants.entityDetailTemplate}`,
      `layout.settings:${plan.appPageVariants.settingsTemplate}`,
      `layout.billing:${plan.appPageVariants.billingTemplate}`,
    );
  }
  return tokens;
}
