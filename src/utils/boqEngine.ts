/**
 * BLCTS Full BOQ (Bill of Quantities) Engine
 *
 * Generates a transparent, section-by-section BOQ for any building
 * based on GFA, building type, construction standard, and county pricing.
 *
 * Every line item shows: section, description, quantity, unit, unit rate, amount.
 * Nothing is hidden. All formulas are applied openly.
 */

import type { BOQLineItem } from "../lib/supabase";
import type { CostEstimateConfig } from "./pricingEngine";

// ─── Construction Rate Database (KSh per m² by building type + standard) ────

export const CONSTRUCTION_RATES_PER_SQM: Record<string, Record<string, number>> = {
  "Residential":  { Economy: 28000, Standard: 38000, Premium: 52000, Luxury: 75000 },
  "Maisonette":   { Economy: 29000, Standard: 40000, Premium: 55000, Luxury: 78000 },
  "Apartment":    { Economy: 30000, Standard: 42000, Premium: 57000, Luxury: 80000 },
  "Commercial":   { Economy: 35000, Standard: 48000, Premium: 65000, Luxury: 90000 },
  "Office":       { Economy: 33000, Standard: 46000, Premium: 62000, Luxury: 88000 },
  "Mixed-Use":    { Economy: 32000, Standard: 43000, Premium: 58000, Luxury: 82000 },
  "Warehouse":    { Economy: 18000, Standard: 25000, Premium: 35000, Luxury: 50000 },
  "School":       { Economy: 22000, Standard: 30000, Premium: 42000, Luxury: 58000 },
  "Hospital":     { Economy: 38000, Standard: 55000, Premium: 78000, Luxury: 110000 },
  "Industrial":   { Economy: 25000, Standard: 35000, Premium: 48000, Luxury: 65000 },
};

// BOQ section allocation (% of construction cost)
const BOQ_SECTION_WEIGHTS: Record<string, number> = {
  "Substructure / Foundation":     0.12,
  "Concrete Frame (Columns/Beams)": 0.14,
  "Floor Slabs":                   0.09,
  "Walls (Blockwork/Brickwork)":   0.10,
  "Roof Structure":                0.08,
  "Roof Covering & Gutters":       0.05,
  "Doors":                         0.04,
  "Windows & Glazing":             0.04,
  "Floor Finishes":                0.07,
  "Wall Finishes & Plastering":    0.06,
  "Ceiling & Insulation":          0.04,
  "Plumbing & Sanitation":         0.07,
  "Electrical Installation":       0.07,
  "Mechanical / HVAC":             0.03,
};

// Quantities derived from GFA for each BOQ section
function derivedQuantities(gfa: number, floors: number): Record<string, { qty: number; unit: string }> {
  const footprint = gfa / Math.max(floors, 1);
  const perimeter = Math.sqrt(footprint) * 4;
  const wallHeight = 3.0; // m per floor

  return {
    "Substructure / Foundation":       { qty: footprint,                    unit: "m²"  },
    "Concrete Frame (Columns/Beams)":  { qty: footprint * floors,           unit: "m²"  },
    "Floor Slabs":                     { qty: gfa,                          unit: "m²"  },
    "Walls (Blockwork/Brickwork)":     { qty: perimeter * wallHeight * floors, unit: "m²"  },
    "Roof Structure":                  { qty: footprint * 1.15,             unit: "m²"  },
    "Roof Covering & Gutters":         { qty: footprint * 1.15,             unit: "m²"  },
    "Doors":                           { qty: Math.max(4, Math.ceil(gfa / 30)), unit: "No."  },
    "Windows & Glazing":               { qty: Math.max(6, Math.ceil(gfa / 25)), unit: "No."  },
    "Floor Finishes":                  { qty: gfa * 0.90,                   unit: "m²"  },
    "Wall Finishes & Plastering":      { qty: perimeter * wallHeight * floors * 2, unit: "m²"  },
    "Ceiling & Insulation":            { qty: gfa * 0.85,                   unit: "m²"  },
    "Plumbing & Sanitation":           { qty: gfa,                          unit: "m²"  },
    "Electrical Installation":         { qty: gfa,                          unit: "m²"  },
    "Mechanical / HVAC":               { qty: gfa,                          unit: "m²"  },
  };
}

export interface FullBOQResult {
  gfa: number;
  floors: number;
  buildingType: string;
  constructionStandard: string;
  county: string;
  countyMultiplier: number;
  costPerSqm: number;
  adjustedCostPerSqm: number;

  // BOQ line items — all 21 sections
  lineItems: BOQLineItem[];

  // Summary totals
  constructionCost: number;
  externalWorks: number;
  preliminaries: number;
  professionalFees: { name: string; rate: number; amount: number }[];
  totalProfessionalFees: number;
  statutoryCosts: number;
  subtotal: number;
  contingency: number;
  preVatTotal: number;
  vatAmount: number;
  totalProjectCost: number;

  // Lifecycle
  lifecycleYears: number;
  annualOpex: number;
  annualMaintenance: number;
  annualUtilities: number;
  annualInsurance: number;
  annualInspection: number;
  totalLifecycleCost: number;
  tco: number;

  // Yearly breakdown for charts
  yearlyProjection: { year: number; opex: number; cumulative: number; maintenance: number; utilities: number }[];

  config: CostEstimateConfig;
}

// Regional multipliers (fallback when Supabase data hasn't loaded)
const COUNTY_MULTIPLIERS: Record<string, number> = {
  "Nairobi": 1.00, "Thika": 0.95, "Mombasa": 1.15, "Kisumu": 1.05,
  "Nakuru": 0.92, "Eldoret": 0.90, "Busia": 0.88,
  "Machakos": 0.93, "Nyeri": 0.91, "Meru": 0.89,
};

export function calculateFullBOQ(
  buildingType: string,
  floors: number,
  floorAreaPerFloor: number,
  annualOpex: number,
  config: CostEstimateConfig,
  county: string,
  regionalRows?: import("../lib/supabase").RegionalPricingRow[]
): FullBOQResult {
  const gfa = floorAreaPerFloor * Math.max(floors, 1);
  const standard = config.constructionStandard;

  // Resolve cost/m² from DB if available, else from hardcoded table
  let costPerSqm = CONSTRUCTION_RATES_PER_SQM[buildingType]?.[standard]
    ?? CONSTRUCTION_RATES_PER_SQM["Residential"][standard];

  let countyMultiplier = COUNTY_MULTIPLIERS[county] ?? 1.0;

  if (regionalRows) {
    const row = regionalRows.find(r => r.county === county);
    if (row) {
      countyMultiplier = row.material_multiplier;
      const key = `base_cost_per_sqm_${standard.toLowerCase()}` as keyof typeof row;
      const dbRate = row[key] as number | undefined;
      if (dbRate && dbRate > 0) costPerSqm = dbRate;
    }
  }

  const adjustedCostPerSqm = costPerSqm * countyMultiplier;
  const constructionCost = gfa * adjustedCostPerSqm;

  // ── BOQ Line Items ──────────────────────────────────────────────────────────
  const quantities = derivedQuantities(gfa, floors);
  const lineItems: BOQLineItem[] = [];

  Object.entries(BOQ_SECTION_WEIGHTS).forEach(([section, weight]) => {
    const sectionCost = constructionCost * weight;
    const { qty, unit } = quantities[section] ?? { qty: gfa, unit: "m²" };
    const unitRate = qty > 0 ? sectionCost / qty : 0;

    lineItems.push({
      section,
      item: section,
      quantity: Math.round(qty * 100) / 100,
      unit,
      unitRate: Math.round(unitRate),
      amount: Math.round(sectionCost),
      source: "estimated",
    });
  });

  // ── Summary Costs ────────────────────────────────────────────────────────────
  const externalWorks = constructionCost * config.externalWorksRate;
  const preliminaries = constructionCost * config.preliminariesRate;

  const professionalFees = [
    { name: "Architect",          rate: config.professionalFees.architect,         amount: constructionCost * config.professionalFees.architect },
    { name: "Structural Engineer",rate: config.professionalFees.structuralEngineer,amount: constructionCost * config.professionalFees.structuralEngineer },
    { name: "Quantity Surveyor",  rate: config.professionalFees.quantitySurveyor,  amount: constructionCost * config.professionalFees.quantitySurveyor },
    { name: "MEP Engineer",       rate: config.professionalFees.mepEngineer,       amount: constructionCost * config.professionalFees.mepEngineer },
    { name: "Project Manager",    rate: config.professionalFees.projectManager,    amount: constructionCost * config.professionalFees.projectManager },
  ];
  const totalProfessionalFees = professionalFees.reduce((s, f) => s + f.amount, 0);
  const statutoryCosts = constructionCost * config.statutoryCostsRate;

  const subtotal = constructionCost + externalWorks + preliminaries + totalProfessionalFees + statutoryCosts;
  const contingency = subtotal * config.contingencyRate;
  const preVatTotal = subtotal + contingency;
  const vatAmount = preVatTotal * config.vatRate;
  const totalProjectCost = preVatTotal + vatAmount;

  // ── Lifecycle Cost ───────────────────────────────────────────────────────────
  const annualMaintenance = constructionCost * 0.015;
  const annualUtilities   = constructionCost * 0.012;
  const annualInsurance   = constructionCost * 0.005;
  const annualInspection  = constructionCost * 0.002;
  const totalAnnualOpex   = annualOpex > 0 ? annualOpex
    : (annualMaintenance + annualUtilities + annualInsurance + annualInspection);

  const inflationRate = 0.06;
  let cumulative = totalProjectCost;
  const yearlyProjection = Array.from({ length: config.lifecycleYears }, (_, i) => {
    const year = i + 1;
    const inflatedOpex = totalAnnualOpex * Math.pow(1 + inflationRate, i);
    cumulative += inflatedOpex;
    const maintenance = annualMaintenance * Math.pow(1 + inflationRate, i);
    const utilities   = annualUtilities   * Math.pow(1 + inflationRate, i);
    return { year, opex: Math.round(inflatedOpex), cumulative: Math.round(cumulative), maintenance: Math.round(maintenance), utilities: Math.round(utilities) };
  });

  const totalLifecycleCost = yearlyProjection.reduce((s, y) => s + y.opex, 0);
  const tco = totalProjectCost + totalLifecycleCost;

  return {
    gfa,
    floors,
    buildingType,
    constructionStandard: standard,
    county,
    countyMultiplier,
    costPerSqm,
    adjustedCostPerSqm,
    lineItems,
    constructionCost,
    externalWorks,
    preliminaries,
    professionalFees,
    totalProfessionalFees,
    statutoryCosts,
    subtotal,
    contingency,
    preVatTotal,
    vatAmount,
    totalProjectCost,
    lifecycleYears: config.lifecycleYears,
    annualOpex: totalAnnualOpex,
    annualMaintenance,
    annualUtilities,
    annualInsurance,
    annualInspection,
    totalLifecycleCost,
    tco,
    yearlyProjection,
    config,
  };
}

// ── Lifecycle cost categories for display ─────────────────────────────────────
export function getLifecycleCostCategories(result: FullBOQResult) {
  return [
    { name: "Maintenance",  annual: result.annualMaintenance, pct: result.annualMaintenance / result.annualOpex * 100 },
    { name: "Utilities",    annual: result.annualUtilities,   pct: result.annualUtilities   / result.annualOpex * 100 },
    { name: "Insurance",    annual: result.annualInsurance,   pct: result.annualInsurance   / result.annualOpex * 100 },
    { name: "Inspections",  annual: result.annualInspection,  pct: result.annualInspection  / result.annualOpex * 100 },
  ];
}
