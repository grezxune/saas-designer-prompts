import { pickRare, type UsageMap } from "./rarity";

export interface PageInteractionPlan {
  navigationModel: string;
  dashboardInteraction: string;
  entityInteraction: string;
  settingsInteraction: string;
  billingInteraction: string;
  feedbackMotion: string;
}

export interface DataShapePlan {
  dashboardDataShape: string;
  listDataShape: string;
  detailDataShape: string;
  settingsDataShape: string;
  analyticsDataShape: string;
}

const NAV = ["command-first", "sidebar-first", "context-tabs", "workspace-switcher"] as const;
const DASH_I = ["drilldown-panels", "drag-layout", "timeline-scrub", "filter-pulses"] as const;
const ENTITY_I = ["bulk-actions", "inline-edit", "drawer-inspect", "split-view"] as const;
const SETTINGS_I = ["wizard-sections", "instant-apply", "review-and-save", "guided-checklist"] as const;
const BILLING_I = ["slider-compare", "plan-cards", "invoice-ledger", "usage-simulator"] as const;
const FEEDBACK = ["subtle", "energetic", "mechanical", "quiet"] as const;

const DASH_D = ["kpi-grid", "metric-ribbon", "activity-stream", "map-heat"] as const;
const LIST_D = ["dense-table", "kanban", "timeline", "cards"] as const;
const DETAIL_D = ["tabbed-panels", "doc-centric", "event-timeline", "inspector"] as const;
const SETTINGS_D = ["grouped-forms", "wizard-steps", "matrix", "split-pane"] as const;
const ANALYTICS_D = ["cohort-grid", "funnel-flow", "trend-matrix", "comparative-cards"] as const;

/**
 * Creates page interaction behavior variants.
 */
export function createPageInteractionPlan(rng: () => number, usage: UsageMap): PageInteractionPlan {
  return {
    navigationModel: pickRare("ix.nav", NAV, usage, rng),
    dashboardInteraction: pickRare("ix.dashboard", DASH_I, usage, rng),
    entityInteraction: pickRare("ix.entity", ENTITY_I, usage, rng),
    settingsInteraction: pickRare("ix.settings", SETTINGS_I, usage, rng),
    billingInteraction: pickRare("ix.billing", BILLING_I, usage, rng),
    feedbackMotion: pickRare("ix.feedback", FEEDBACK, usage, rng),
  };
}

/**
 * Creates data-shape variants by page type.
 */
export function createDataShapePlan(rng: () => number, usage: UsageMap): DataShapePlan {
  return {
    dashboardDataShape: pickRare("data.dashboard", DASH_D, usage, rng),
    listDataShape: pickRare("data.list", LIST_D, usage, rng),
    detailDataShape: pickRare("data.detail", DETAIL_D, usage, rng),
    settingsDataShape: pickRare("data.settings", SETTINGS_D, usage, rng),
    analyticsDataShape: pickRare("data.analytics", ANALYTICS_D, usage, rng),
  };
}

export function makeInteractionSignature(plan: PageInteractionPlan): string {
  return [
    plan.navigationModel,
    plan.dashboardInteraction,
    plan.entityInteraction,
    plan.settingsInteraction,
    plan.billingInteraction,
    plan.feedbackMotion,
  ].join("|");
}

export function makeDataShapeSignature(plan: DataShapePlan): string {
  return [
    plan.dashboardDataShape,
    plan.listDataShape,
    plan.detailDataShape,
    plan.settingsDataShape,
    plan.analyticsDataShape,
  ].join("|");
}

export function interactionTokens(plan: PageInteractionPlan): string[] {
  return [
    `ix.nav:${plan.navigationModel}`,
    `ix.dashboard:${plan.dashboardInteraction}`,
    `ix.entity:${plan.entityInteraction}`,
    `ix.settings:${plan.settingsInteraction}`,
    `ix.billing:${plan.billingInteraction}`,
    `ix.feedback:${plan.feedbackMotion}`,
  ];
}

export function dataShapeTokens(plan: DataShapePlan): string[] {
  return [
    `data.dashboard:${plan.dashboardDataShape}`,
    `data.list:${plan.listDataShape}`,
    `data.detail:${plan.detailDataShape}`,
    `data.settings:${plan.settingsDataShape}`,
    `data.analytics:${plan.analyticsDataShape}`,
  ];
}
