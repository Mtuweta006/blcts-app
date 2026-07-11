import { regionalPricingDatabase, countyList } from "../data/regionalPricing";
import { RegionalPricingDatabase, PricingItem, PricingEngineConfig } from "../types";

export type ItemType = "material" | "labour" | "service";

export interface PriceBreakdown {
  basePrice: number;
  safetyMargin: number;
  marginAmount: number;
  finalPrice: number;
  unit: string;
  name: string;
  notes?: string;
}

export interface CostEstimateConfig {
  constructionStandard: "Economy" | "Standard" | "Premium" | "Luxury";
  vatRate: number;
  contingencyRate: number;
  professionalFees: {
    architect: number;
    structuralEngineer: number;
    quantitySurveyor: number;
    mepEngineer: number;
    projectManager: number;
  };
  externalWorksRate: number;
  statutoryCostsRate: number;
  preliminariesRate: number;
  lifecycleYears: number;
}

export const DEFAULT_CONFIG: CostEstimateConfig = {
  constructionStandard: "Standard",
  vatRate: 0.16,
  contingencyRate: 0.075,
  professionalFees: {
    architect: 0.035,
    structuralEngineer: 0.025,
    quantitySurveyor: 0.03,
    mepEngineer: 0.02,
    projectManager: 0.02,
  },
  externalWorksRate: 0.10,
  statutoryCostsRate: 0.02,
  preliminariesRate: 0.10,
  lifecycleYears: 30,
};

export const CONSTRUCTION_RATES: Record<string, Record<string, number>> = {
  Residential: { Economy: 28000, Standard: 38000, Premium: 52000, Luxury: 75000 },
  Commercial: { Economy: 35000, Standard: 48000, Premium: 65000, Luxury: 90000 },
  "Mixed-Use": { Economy: 32000, Standard: 43000, Premium: 58000, Luxury: 82000 },
  Industrial: { Economy: 25000, Standard: 35000, Premium: 48000, Luxury: 65000 },
};

const DEFAULT_SAFETY_MARGIN = 20;
const STORAGE_KEY = "blcts-safety-margin";
const CONFIG_STORAGE_KEY = "blcts-cost-config";

export function getSafetyMarginFromStorage(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val >= 20 && val <= 100) return val;
    }
  } catch {}
  return DEFAULT_SAFETY_MARGIN;
}

export function setSafetyMarginToStorage(margin: number): void {
  try {
    const clamped = Math.max(20, Math.min(100, margin));
    localStorage.setItem(STORAGE_KEY, String(clamped));
  } catch {}
}

export function getCostConfigFromStorage(): CostEstimateConfig {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function setCostConfigToStorage(config: CostEstimateConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function getRegionalPricingDatabase(): RegionalPricingDatabase {
  return regionalPricingDatabase;
}

export function getAllCounties(): string[] {
  return countyList;
}

export function getCountyPricing(county: string): RegionalPricingDatabase[string] | null {
  return regionalPricingDatabase[county] || null;
}

export function getPriceForLocation(
  itemId: string,
  itemType: ItemType,
  county: string,
  safetyMarginPct?: number
): PriceBreakdown | null {
  const countyData = getCountyPricing(county);
  if (!countyData) return null;

  const category = itemType === "material" ? countyData.materials :
                    itemType === "labour" ? countyData.labour :
                    countyData.services;

  const item = category.find(i => i.id === itemId || i.name === itemId);
  if (!item) return null;

  const marginPct = (safetyMarginPct ?? getSafetyMarginFromStorage()) / 100;
  const marginAmount = Math.max(item.basePrice * marginPct, 20);
  const finalPrice = item.basePrice + marginAmount;

  return {
    basePrice: item.basePrice,
    safetyMargin: safetyMarginPct ?? getSafetyMarginFromStorage(),
    marginAmount,
    finalPrice,
    unit: item.unit,
    name: item.name,
    notes: item.notes
  };
}

export function calculateTotalPrice(basePrice: number, safetyMarginPct: number): number {
  const marginAmount = Math.max(basePrice * (safetyMarginPct / 100), 20);
  return basePrice + marginAmount;
}

export function validateLocationAndItem(itemId: string, itemType: ItemType, county: string): boolean {
  const countyData = getCountyPricing(county);
  if (!countyData) return false;

  const category = itemType === "material" ? countyData.materials :
                    itemType === "labour" ? countyData.labour :
                    countyData.services;

  return category.some(i => i.id === itemId || i.name === itemId);
}

export function getAllItemsForCounty(county: string, itemType: ItemType): PricingItem[] {
  const countyData = getCountyPricing(county);
  if (!countyData) return [];

  return itemType === "material" ? countyData.materials :
         itemType === "labour" ? countyData.labour :
         countyData.services;
}

export function calculateProjectCostForCounty(
  county: string,
  quantities: { itemId: string; itemType: ItemType; quantity: number }[]
): { items: (PriceBreakdown & { quantity: number; totalCost: number })[]; grandTotal: number } {
  const margin = getSafetyMarginFromStorage();
  const items: (PriceBreakdown & { quantity: number; totalCost: number })[] = [];
  let grandTotal = 0;

  for (const q of quantities) {
    const price = getPriceForLocation(q.itemId, q.itemType, county, margin);
    if (price) {
      const totalCost = price.finalPrice * q.quantity;
      grandTotal += totalCost;
      items.push({ ...price, quantity: q.quantity, totalCost });
    }
  }

  return { items, grandTotal };
}

export function compareCountyPrices(itemId: string, itemType: ItemType): { county: string; basePrice: number; finalPrice: number }[] {
  const margin = getSafetyMarginFromStorage();
  const results: { county: string; basePrice: number; finalPrice: number }[] = [];

  for (const county of countyList) {
    const price = getPriceForLocation(itemId, itemType, county, margin);
    if (price) {
      results.push({ county, basePrice: price.basePrice, finalPrice: price.finalPrice });
    }
  }

  return results.sort((a, b) => a.finalPrice - b.finalPrice);
}

export interface QSEstimateResult {
  gfa: number;
  costPerSqm: number;
  constructionCost: number;
  externalWorks: number;
  preliminaries: number;
  professionalFees: { name: string; rate: number; amount: number }[];
  totalProfessionalFees: number;
  statutoryCosts: number;
  subtotal: number;
  contingency: number;
  vatAmount: number;
  totalProjectCost: number;
  lifecycleYears: number;
  annualOpex: number;
  totalLifecycleCost: number;
  tco: number;
  isFallback: boolean;
  config: CostEstimateConfig;
}

export function calculateQSEstimate(
  buildingType: string,
  floors: number,
  floorArea: number,
  annualOpex: number,
  config: CostEstimateConfig,
  county?: string
): QSEstimateResult {
  const gfa = Math.max(0, floorArea * Math.max(1, floors));
  const rates = CONSTRUCTION_RATES[buildingType] || CONSTRUCTION_RATES["Commercial"];
  const costPerSqm = rates[config.constructionStandard] || rates["Standard"];

  let baseCostPerSqm = costPerSqm;
  if (county) {
    const countyData = getCountyPricing(county);
    if (countyData) {
      const margin = getSafetyMarginFromStorage() / 100;
      baseCostPerSqm = costPerSqm * (1 + margin);
    }
  }

  const constructionCost = gfa * baseCostPerSqm;
  const externalWorks = constructionCost * config.externalWorksRate;
  const preliminaries = constructionCost * config.preliminariesRate;

  const professionalFees = [
    { name: "Architect", rate: config.professionalFees.architect, amount: constructionCost * config.professionalFees.architect },
    { name: "Structural Engineer", rate: config.professionalFees.structuralEngineer, amount: constructionCost * config.professionalFees.structuralEngineer },
    { name: "Quantity Surveyor", rate: config.professionalFees.quantitySurveyor, amount: constructionCost * config.professionalFees.quantitySurveyor },
    { name: "MEP Engineer", rate: config.professionalFees.mepEngineer, amount: constructionCost * config.professionalFees.mepEngineer },
    { name: "Project Manager", rate: config.professionalFees.projectManager, amount: constructionCost * config.professionalFees.projectManager },
  ];
  const totalProfessionalFees = professionalFees.reduce((sum, f) => sum + f.amount, 0);
  const statutoryCosts = constructionCost * config.statutoryCostsRate;

  const subtotal = constructionCost + externalWorks + preliminaries + totalProfessionalFees + statutoryCosts;
  const contingency = subtotal * config.contingencyRate;
  const preVatTotal = subtotal + contingency;
  const vatAmount = preVatTotal * config.vatRate;
  const totalProjectCost = preVatTotal + vatAmount;

  const lifecycleYears = config.lifecycleYears;
  const totalLifecycleCost = totalProjectCost + (annualOpex * lifecycleYears);
  const tco = totalLifecycleCost;

  return {
    gfa,
    costPerSqm: baseCostPerSqm,
    constructionCost,
    externalWorks,
    preliminaries,
    professionalFees,
    totalProfessionalFees,
    statutoryCosts,
    subtotal,
    contingency,
    vatAmount,
    totalProjectCost,
    lifecycleYears,
    annualOpex,
    totalLifecycleCost,
    tco,
    isFallback: false,
    config,
  };
}

export function formatKSh(amount: number): string {
  return `KSh ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const pricingEngineConfig: PricingEngineConfig = {
  defaultSafetyMargin: DEFAULT_SAFETY_MARGIN,
  minSafetyMargin: 20,
  maxSafetyMargin: 100,
  currency: "KSh",
  storageKey: STORAGE_KEY
};
