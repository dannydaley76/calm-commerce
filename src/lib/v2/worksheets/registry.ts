import founderRulesSheet from "./founder-rules-sheet.json";
import sourcingModelSheet from "./sourcing-model-sheet.json";
import ideasWorksheet from "./ideas-worksheet.json";
import unitEconomicsWorksheet from "./unit-economics-worksheet.json";
import preStoreTestWorksheet from "./pre-store-test-worksheet.json";
import customerProfileWorksheet from "./customer-profile-worksheet.json";
import offerWorksheet from "./offer-worksheet.json";
import productListingWorksheet from "./product-listing-worksheet.json";
import storeReadinessChecklist from "./store-readiness-checklist.json";
import trafficPlanWorksheet from "./traffic-plan-worksheet.json";
import adTestWorksheet from "./ad-test-worksheet.json";
import emailRetentionWorksheet from "./email-retention-worksheet.json";
import weeklyReviewTemplate from "./weekly-review-template.json";
import iterationDecisionWorksheet from "./iteration-decision-worksheet.json";
import growthStrategyWorksheet from "./growth-strategy-worksheet.json";
import weeklyMetrics from "./weekly-metrics.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WORKSHEET_REGISTRY: Record<string, any> = {
  "founder-rules-sheet": founderRulesSheet,
  "sourcing-model-sheet": sourcingModelSheet,
  "ideas-worksheet": ideasWorksheet,
  "unit-economics-worksheet": unitEconomicsWorksheet,
  "pre-store-test-worksheet": preStoreTestWorksheet,
  "customer-profile-worksheet": customerProfileWorksheet,
  "offer-worksheet": offerWorksheet,
  "product-listing-worksheet": productListingWorksheet,
  "store-readiness-checklist": storeReadinessChecklist,
  "traffic-plan-worksheet": trafficPlanWorksheet,
  "ad-test-worksheet": adTestWorksheet,
  "email-retention-worksheet": emailRetentionWorksheet,
  "weekly-review-template": weeklyReviewTemplate,
  "iteration-decision-worksheet": iterationDecisionWorksheet,
  "growth-strategy-worksheet": growthStrategyWorksheet,
  "weekly-metrics": weeklyMetrics,
};
