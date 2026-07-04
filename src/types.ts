/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Property {
  id: string;
  name: string;
  location: string;
  type: "Residential" | "Commercial" | "Mixed-Use" | "Industrial" | string;
  capexBudget: number;
  opexBudget: number;
  healthGrade: "A" | "B" | "C" | "D" | "N/A" | string;
  healthStatusText: string;
  description: string;
  code?: string;
  clientName?: string;
  estimatedFloorArea?: number;
  address?: string;
  city?: string;
  county?: string;
  country?: string;
  gps?: string;
  floors?: number;
  units?: number;
  occupancy?: number;
  constructionStartDate?: string;
  completionDate?: string;
  constructionYear?: number;
  initialConstructionCost?: number;
  materialCost?: number;
  labourCost?: number;
  maintenanceCost?: number;
  utilityCost?: number;
  repairCost?: number;
  renovationCost?: number;
  otherCost?: number;
  expectedLifecycleYears?: number;
  status?: "Active" | "Under Construction" | "Renovation" | "Archived" | string;
  totalLifecycleCostRecord?: number;
  lastUpdated?: string;
  isSoftDeleted?: boolean;
  blueprintUrl?: string;
  observations?: string[];
  buildingValue?: number;
  replacementCost?: number;
  depreciation?: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  owner?: string;
  developer?: string;
}

export type LifecyclePhase = "Construction" | "Operational" | "Maintenance" | "End-of-Life";

export interface CostEntry {
  id: string;
  propertyId: string;
  phase: LifecyclePhase;
  component: string;
  amount: number;
  date: string;
  contractor: string;
  status: "Pending" | "Completed" | "Paid";
  description: string;
}

export interface MaintenanceTask {
  id: string;
  propertyId: string;
  component: string;
  status: "Scheduled" | "In-Progress" | "Completed" | "Paid" | "Overdue";
  targetDate: string;
  contractor: string;
  amount: number;
  phone?: string;
}

export interface ChartDataPoint {
  month: string;
  capexBudget: number;
  capexActual: number;
  opexBudget: number;
  opexActual: number;
}

export interface AIInsight {
  type: "opportunity" | "warning" | "alert";
  title: string;
  description: string;
  financialImpact: string;
  recommendedAction: string;
}

export type UserRole =
  | "Developer"
  | "Super Admin"
  | "Property Manager"
  | "Finance Officer"
  | "Maintenance Officer"
  | "Vendor"
  | "Auditor"
  | "Executive"
  | "Facility Manager"
  | "Maintenance Engineer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  scopeProperties?: string[];
}

export interface Asset {
  id: string;
  propertyId: string;
  name: string;
  category: "HVAC Systems" | "Elevators" | "Solar Installations" | "Water Systems" | "Electrical Infrastructure" | "Security Systems" | "Generators" | "Fire Safety Equipment" | "Plumbing" | "Roofing" | "Structural Components";
  installationDate: string;
  expectedLifespan: number;
  warrantyInfo: string;
  vendor: string;
  maintenanceSchedule: "Monthly" | "Quarterly" | "Bi-Annually" | "Annually";
  currentCondition: "New" | "Good" | "Fair" | "Poor" | "Critical";
  replacementCost: number;
  remainingUsefulLife?: number;
  maintenanceHistory?: { date: string; description: string; cost: number }[];
}

export interface MaintenanceRecord {
  id: string;
  propertyId: string;
  assetId?: string;
  type: "Preventive" | "Corrective" | "Predictive" | "Emergency";
  cost: number;
  vendor: string;
  date: string;
  status: "Scheduled" | "In-Progress" | "Completed" | "Overdue";
  notes: string;
  technician?: string;
  downtime?: number;
  partsUsed?: string;
  labourHours?: number;
  attachments: string[];
}

export interface UploadedDocument {
  id: string;
  propertyId: string;
  title: string;
  category: "Architectural Drawings" | "BOQs" | "Contracts" | "Invoices" | "Inspection Reports" | "Maintenance Reports" | "Vendor Agreements";
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
  version: number;
  history: { version: number; date: string; user: string; action: string }[];
}

export interface AppNotification {
  id: string;
  propertyId?: string;
  title: string;
  message: string;
  type: "maintenance" | "budget" | "contract" | "warranty" | "ai_recommendation" | "compliance" | "equipment";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  isRead: boolean;
  channel: "in-app" | "email" | "both";
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  propertyId?: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: "Contractor" | "Supplier" | "Consultant" | "Engineer";
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  contractValue: number;
  contractExpiry: string;
  performanceRating: number;
  deliveryOnTimeRate: number;
  paymentTerms: string;
  complianceCertified: boolean;
  complianceExpiry?: string;
  deliveryHistory: { date: string; item: string; status: "On-Time" | "Late" | "Cancelled"; value: number }[];
  paymentHistory: { date: string; amount: number; status: "Paid" | "Pending" | "Overdue" }[];
}

export interface Material {
  id: string;
  name: string;
  category: string;
  supplier: string;
  manufacturer: string;
  unit: string;
  currentPrice: number;
  historicalPrices: { date: string; price: number }[];
  leadTimeDays: number;
  availability: "In Stock" | "Low Stock" | "Out of Stock" | "Pre-Order";
  carbonFootprint: number;
}

export interface ComplianceItem {
  id: string;
  propertyId: string;
  regulation: string;
  category: "Building Codes" | "Fire Safety" | "OSHA" | "Environmental" | "Structural Inspection";
  status: "Compliant" | "Non-Compliant" | "Pending Review" | "Expired";
  lastInspectionDate: string;
  nextInspectionDate: string;
  authority: string;
  notes: string;
}

export interface SustainabilityMetric {
  id: string;
  propertyId: string;
  month: string;
  electricityKwh: number;
  waterLitres: number;
  carbonEmissionsKg: number;
  renewableEnergyKwh: number;
  wasteGeneratedKg: number;
  greenBuildingScore: number;
}

export interface AIPrediction {
  id: string;
  propertyId: string;
  category: "Maintenance Cost" | "Operating Cost" | "Equipment Failure" | "Budget Overrun" | "Utility Consumption" | "Asset Replacement";
  prediction: string;
  predictedValue: number;
  confidenceScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  recommendation: string;
  supportingData: string;
  timeframe: string;
}

export interface Anomaly {
  id: string;
  propertyId: string;
  category: "Utility Spike" | "Maintenance Overrun" | "Vendor Overcharging" | "Budget Deviation" | "Equipment Failure" | "Energy Wastage" | "Water Leak";
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  detectedValue: number;
  expectedValue: number;
  deviationPercent: number;
  recommendation: string;
  detectedAt: string;
  isResolved: boolean;
}

export interface RiskItem {
  id: string;
  propertyId: string;
  description: string;
  category: "Financial" | "Operational" | "Structural" | "Compliance" | "Market";
  probability: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High" | "Critical";
  mitigation: string;
  status: "Open" | "Mitigated" | "Closed";
}

export type ActiveTabType =
  | "dashboard"
  | "admin-dashboard"
  | "facility-dashboard"
  | "properties-mgmt"
  | "cost-estimation"
  | "vendors"
  | "assets"
  | "maintenance"
  | "ai-predictions"
  | "sustainability"
  | "compliance"
  | "reports"
  | "notifications"
  | "system-settings"
  | "user-management";

export interface PricingItem {
  id: string;
  name: string;
  basePrice: number;
  unit: string;
  notes?: string;
}

export interface RegionalPricing {
  materials: PricingItem[];
  labour: PricingItem[];
  services: PricingItem[];
  notes?: string;
}

export interface RegionalPricingDatabase {
  [county: string]: RegionalPricing;
}

export interface PricingEngineConfig {
  defaultSafetyMargin: number;
  minSafetyMargin: number;
  maxSafetyMargin: number;
  currency: string;
  storageKey: string;
}

export interface SystemSettings {
  safetyMargin: number;
  aiModel: string;
  notificationChannels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  auditLogs: AuditLog[];
}

export const ADMIN_ROLES: UserRole[] = ["Developer", "Super Admin", "Executive", "Finance Officer", "Auditor"];

export const FM_ROLES: UserRole[] = ["Facility Manager", "Maintenance Engineer", "Property Manager"];

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

export function isFacilityManagerRole(role: string): boolean {
  return FM_ROLES.includes(role as UserRole);
}
