import { regionalPricingDatabase, countyList } from "../data/regionalPricing";
import { RegionalPricingDatabase, PricingItem, PricingEngineConfig } from "../types";

export type ItemType = "material" | "labour" | "service";

export interface PriceBreakdown {
  basePrice: number;
  safetyMargin: number;
  finalPrice: number;
  unit: string;
  name: string;
  notes?: string;
}

const DEFAULT_SAFETY_MARGIN = 20;
const STORAGE_KEY = "blcts-safety-margin";

export function getSafetyMarginFromStorage(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val >= 20 && val <= 100) return val;
    }
  } catch (e) {}
  return DEFAULT_SAFETY_MARGIN;
}

export function setSafetyMarginToStorage(margin: number): void {
  try {
    const clamped = Math.max(20, Math.min(100, margin));
    localStorage.setItem(STORAGE_KEY, String(clamped));
  } catch (e) {}
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
  safetyMargin?: number
): PriceBreakdown | null {
  const countyData = getCountyPricing(county);
  if (!countyData) return null;

  const category = itemType === "material" ? countyData.materials :
                    itemType === "labour" ? countyData.labour :
                    countyData.services;

  const item = category.find(i => i.id === itemId || i.name === itemId);
  if (!item) return null;

  const margin = safetyMargin ?? getSafetyMarginFromStorage();
  const finalPrice = item.basePrice + margin;

  return {
    basePrice: item.basePrice,
    safetyMargin: margin,
    finalPrice,
    unit: item.unit,
    name: item.name,
    notes: item.notes
  };
}

export function calculateTotalPrice(basePrice: number, safetyMargin: number): number {
  return basePrice + safetyMargin;
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

export const pricingEngineConfig: PricingEngineConfig = {
  defaultSafetyMargin: DEFAULT_SAFETY_MARGIN,
  minSafetyMargin: 0,
  maxSafetyMargin: 100,
  currency: "KSh",
  storageKey: STORAGE_KEY
};
