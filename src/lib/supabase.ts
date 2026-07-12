import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types mirroring DB tables ──────────────────────────────────────────────

export interface RegionalPricingRow {
  id: string;
  county: string;
  material_multiplier: number;
  labour_multiplier: number;
  service_multiplier: number;
  inflation_factor: number;
  transport_factor: number;
  base_cost_per_sqm_economy: number;
  base_cost_per_sqm_standard: number;
  base_cost_per_sqm_premium: number;
  base_cost_per_sqm_luxury: number;
  notes: string | null;
  updated_at: string;
}

export interface ConstructionMaterialRow {
  id: string;
  county: string;
  category: "material" | "labour" | "service";
  item_id: string;
  name: string;
  unit_price: number;
  unit: string;
  notes: string | null;
  updated_at: string;
}

export interface BOQEstimateRow {
  id: string;
  property_id: string;
  property_name: string;
  county: string;
  building_type: string;
  construction_standard: string;
  gfa: number;
  floors: number;
  cost_per_sqm: number;
  construction_cost: number;
  external_works: number;
  preliminaries: number;
  professional_fees: { name: string; rate: number; amount: number }[];
  statutory_costs: number;
  subtotal: number;
  contingency: number;
  vat_amount: number;
  total_project_cost: number;
  lifecycle_years: number;
  annual_opex: number;
  total_lifecycle_cost: number;
  tco: number;
  boq_line_items: BOQLineItem[];
  blueprint_observations: string[];
  ai_confidence: number | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BOQLineItem {
  section: string;
  item: string;
  quantity: number;
  unit: string;
  unitRate: number;
  amount: number;
  source: "measured" | "estimated" | "regional-rate";
}

// ─── Regional pricing cache ──────────────────────────────────────────────────

let _regionalCache: RegionalPricingRow[] | null = null;
let _materialsCache: ConstructionMaterialRow[] | null = null;

export async function fetchRegionalPricing(): Promise<RegionalPricingRow[]> {
  if (_regionalCache) return _regionalCache;
  const { data, error } = await supabase
    .from("regional_pricing")
    .select("*")
    .order("county");
  if (error || !data) return [];
  _regionalCache = data as RegionalPricingRow[];
  return _regionalCache;
}

export async function fetchConstructionMaterials(): Promise<ConstructionMaterialRow[]> {
  if (_materialsCache) return _materialsCache;
  const { data, error } = await supabase
    .from("construction_materials")
    .select("*")
    .order("category")
    .order("name");
  if (error || !data) return [];
  _materialsCache = data as ConstructionMaterialRow[];
  return _materialsCache;
}

export function invalidatePricingCache() {
  _regionalCache = null;
  _materialsCache = null;
}

export async function updateMaterialPrice(
  id: string,
  unitPrice: number
): Promise<boolean> {
  invalidatePricingCache();
  const { error } = await supabase
    .from("construction_materials")
    .update({ unit_price: unitPrice, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function saveBOQEstimate(estimate: Omit<BOQEstimateRow, "id" | "created_at" | "updated_at">): Promise<string | null> {
  const { data, error } = await supabase
    .from("boq_estimates")
    .insert(estimate)
    .select("id")
    .maybeSingle();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function getBOQEstimatesForProperty(propertyId: string): Promise<BOQEstimateRow[]> {
  const { data, error } = await supabase
    .from("boq_estimates")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as BOQEstimateRow[];
}

// ─── Maintenance tasks (persistent, from DB only) ────────────────────────────

export interface MaintenanceTaskRow {
  id: string;
  property_id: string;
  title: string;
  description: string;
  component: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string;
  technician: string;
  vendor: string;
  estimated_cost: number;
  actual_cost: number;
  target_date: string;
  completed_date: string | null;
  verified_by: string | null;
  phone: string | null;
  notes: string;
  parts_used: string | null;
  labour_hours: number | null;
  downtime: number | null;
  attachments: string[];
  work_order_number: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchMaintenanceTasks(propertyId?: string): Promise<MaintenanceTaskRow[]> {
  let q = supabase.from("maintenance_tasks").select("*").order("created_at", { ascending: false });
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as MaintenanceTaskRow[];
}

export async function upsertMaintenanceTask(task: Omit<MaintenanceTaskRow, "created_at">): Promise<boolean> {
  const { error } = await supabase
    .from("maintenance_tasks")
    .upsert({ ...task, updated_at: new Date().toISOString() });
  return !error;
}

export async function deleteMaintenanceTask(id: string): Promise<boolean> {
  const { error } = await supabase.from("maintenance_tasks").delete().eq("id", id);
  return !error;
}
