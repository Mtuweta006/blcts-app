/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Property, CostEntry, MaintenanceTask, ChartDataPoint, AIInsight,
  Vendor, Material, Asset, MaintenanceRecord, ComplianceItem,
  SustainabilityMetric, AIPrediction, Anomaly, RiskItem, AppNotification,
  SystemSettings, AuditLog
} from "./types";

export const initialProperties: Property[] = [
  {
    id: "prop-1",
    name: "Kilimani Crest Heights",
    location: "Lenana Road, Kilimani, Nairobi",
    type: "Mixed-Use",
    capexBudget: 145000000,
    opexBudget: 12000000,
    healthGrade: "A",
    healthStatusText: "Optimal Efficiency",
    description: "Multi-family premium development utilizing double-glazed solar defense glass, rainwater harvesting, and continuous concrete waterproofing. High durability choices yield low long-term operational expenses.",
    status: "Under Construction",
    constructionStartDate: "2025-01-15",
    completionDate: "2026-12-20",
    constructionYear: 2025,
    initialConstructionCost: 145000000,
    materialCost: 40000000,
    labourCost: 25000000,
    maintenanceCost: 12000000,
    utilityCost: 8500000,
    repairCost: 4500000,
    renovationCost: 18000000,
    otherCost: 3000000,
    expectedLifecycleYears: 50,
    floors: 14,
    units: 56,
    occupancy: 0,
    code: "KCH-001",
    clientName: "Wandera Investments Ltd",
    owner: "Wandera Investments Ltd",
    developer: "Crest Development Group",
    estimatedFloorArea: 5400,
    address: "Lenana Road, Kilimani",
    city: "Nairobi",
    county: "Nairobi",
    country: "Kenya",
    gps: "-1.2921, 36.7819",
    buildingValue: 220000000,
    replacementCost: 185000000,
    depreciation: 35000000,
    insuranceProvider: "Jubilee Insurance",
    insurancePolicyNumber: "JUB-2025-04471",
    insuranceExpiry: "2027-01-14"
  },
  {
    id: "prop-2",
    name: "Thika Road Commercial Park",
    location: "Ruiru Exit 11, Thika Highway",
    type: "Commercial",
    capexBudget: 95000000,
    opexBudget: 24000000,
    healthGrade: "C",
    healthStatusText: "High Maintenance Risk",
    description: "Suburban logistics and retail hub. Uses sub-standard single-layer corrugated roofing sheets and standard low-efficiency HVAC motors. Suffers heavy 'first-cost bias' where low initial cost led to extreme utility and maintenance invoices.",
    status: "Under Construction",
    constructionStartDate: "2025-03-01",
    completionDate: "2026-11-15",
    constructionYear: 2025,
    initialConstructionCost: 95000000,
    materialCost: 30000000,
    labourCost: 18000000,
    maintenanceCost: 24000000,
    utilityCost: 19500000,
    repairCost: 8500000,
    renovationCost: 12000000,
    otherCost: 5000000,
    expectedLifecycleYears: 30,
    floors: 5,
    units: 20,
    occupancy: 0,
    code: "TCP-002",
    clientName: "Kenyatta Road Associates",
    owner: "Kenyatta Road Associates",
    developer: "Highway Builders Ltd",
    estimatedFloorArea: 3200,
    address: "Ruiru Exit 11, Thika Highway",
    city: "Kiambu",
    county: "Kiambu",
    country: "Kenya",
    gps: "-1.1465, 36.9456",
    buildingValue: 130000000,
    replacementCost: 110000000,
    depreciation: 20000000,
    insuranceProvider: "APA Insurance",
    insurancePolicyNumber: "APA-2025-11209",
    insuranceExpiry: "2026-11-30"
  },
  {
    id: "prop-3",
    name: "Westlands Executive Suites",
    location: "Mvuli Road, Westlands, Nairobi",
    type: "Residential",
    capexBudget: 210000000,
    opexBudget: 18000000,
    healthGrade: "B",
    healthStatusText: "Good Standing",
    description: "Premium office suite block. Equipped with automated LED grids and smart sensor integration. Features partial rooftop solar. Good durability, with predictable minor elevator and pump repairs scheduled.",
    status: "Active",
    constructionStartDate: "2023-06-10",
    completionDate: "2025-04-18",
    constructionYear: 2023,
    initialConstructionCost: 210000000,
    materialCost: 60000000,
    labourCost: 35000000,
    maintenanceCost: 18000000,
    utilityCost: 12000000,
    repairCost: 6000000,
    renovationCost: 25000000,
    otherCost: 8000000,
    expectedLifecycleYears: 40,
    floors: 10,
    units: 40,
    occupancy: 92,
    code: "WES-003",
    clientName: "Westlands Suites LLC",
    owner: "Westlands Suites LLC",
    developer: "Nairobi Premium Construction",
    estimatedFloorArea: 8000,
    address: "Mvuli Road, Westlands",
    city: "Nairobi",
    county: "Nairobi",
    country: "Kenya",
    gps: "-1.2649, 36.8067",
    buildingValue: 320000000,
    replacementCost: 265000000,
    depreciation: 55000000,
    insuranceProvider: "UAP Old Mutual",
    insurancePolicyNumber: "UAP-2023-77821",
    insuranceExpiry: "2026-06-09"
  }
];

export const initialCostEntries: CostEntry[] = [
  { id: "cost-101", propertyId: "prop-1", phase: "Construction", component: "Foundation Waterproofing (Durability Upgrade)", amount: 8500000, date: "2024-03-12", contractor: "Bamburi Special Concrete", status: "Paid", description: "Waterproofing membrane additives included in foundations. Eliminated structural water ingress entirely." },
  { id: "cost-102", propertyId: "prop-1", phase: "Construction", component: "Double-Glazed Low-E Glass Installation", amount: 14200000, date: "2024-06-20", contractor: "Alumil Kenya Ltd", status: "Paid", description: "Premium glazing installed to decrease radiative heating, reducing HVAC cooling requirement by 35%." },
  { id: "cost-103", propertyId: "prop-1", phase: "Operational", component: "Rooftop Solar Battery Grid Power Draw", amount: 450000, date: "2026-04-10", contractor: "Kenya Power (Supplemental)", status: "Paid", description: "Monthly supplemental power draw grid invoice. Unusually low due to rooftop solar array contribution." },
  { id: "cost-104", propertyId: "prop-1", phase: "Maintenance", component: "Solar System Annual Inverter Tune-Up", amount: 180000, date: "2026-05-01", contractor: "Davis & Shirtliff", status: "Paid", description: "Preventative recalibration and cleaning of the centralized string inverters." },
  { id: "cost-201", propertyId: "prop-2", phase: "Construction", component: "Standard Corrugated Roofing (Economy Grade)", amount: 3200000, date: "2023-01-15", contractor: "Local Roofing Wholesalers", status: "Paid", description: "Budget roofing choice made during building to compress construction costs. Corroding prematurely." },
  { id: "cost-202", propertyId: "prop-2", phase: "Construction", component: "Standard HVAC Units (High-Power Draw)", amount: 9800000, date: "2023-03-10", contractor: "Usoni Air Conditioning", status: "Paid", description: "Cheapest cooling motors available. High carbon emission indexes and low COP (Coefficient of Performance)." },
  { id: "cost-203", propertyId: "prop-2", phase: "Operational", component: "Monthly Electricity Utility Invoice (Total Block)", amount: 1950000, date: "2026-04-20", contractor: "Kenya Power Ltd", status: "Paid", description: "Electrical utility invoice. Includes severe active inductive load penalties from non-VFD motors." },
  { id: "cost-204", propertyId: "prop-2", phase: "Maintenance", component: "Roof Degradation Patchwork & Sealants", amount: 850000, date: "2026-05-18", contractor: "Apex Roofing Kenya", status: "Paid", description: "Urgent mastic sealant and epoxy patching applied after a central bay leak damaged retail stock." },
  { id: "cost-301", propertyId: "prop-3", phase: "Construction", component: "Elevator & Mechanical Subsystems", amount: 18500000, date: "2024-11-05", contractor: "Otis East Africa Ltd", status: "Paid", description: "Variable frequency drive elevators with premium suspension cables and regenerative braking." },
  { id: "cost-302", propertyId: "prop-3", phase: "Operational", component: "Monthly Water Supply & Sewerage Connection", amount: 280000, date: "2026-05-10", contractor: "Nairobi Water (NCWSC)", status: "Paid", description: "Mains utility water invoice including greywater chargebacks." }
];

export const initialMaintenanceTasks: MaintenanceTask[] = [
  { id: "maint-101", propertyId: "prop-1", component: "Greywater Harvesting Filtration Flushing", status: "Completed", targetDate: "2026-05-20", contractor: "Davis & Shirtliff", amount: 120000, phone: "254712345678" },
  { id: "maint-102", propertyId: "prop-1", component: "Smart Security Gate Remote Integration", status: "Scheduled", targetDate: "2026-06-05", contractor: "Security Group Africa (SGA)", amount: 250000, phone: "254722998877" },
  { id: "maint-103", propertyId: "prop-1", component: "Fire Alarm Sensor Calibrations", status: "In-Progress", targetDate: "2026-06-12", contractor: "Apex Fire Safety Kenya", amount: 180000, phone: "254733445566" },
  { id: "maint-201", propertyId: "prop-2", component: "Emergency Electrical DB Board Rewiring", status: "Completed", targetDate: "2026-05-24", contractor: "PowerLink Engineers Nairobi", amount: 460000, phone: "254711223344" },
  { id: "maint-202", propertyId: "prop-2", component: "Full Metal Roofing Sheet Replacement (3 Blocks)", status: "Scheduled", targetDate: "2026-07-15", contractor: "Mabati Rolling Mills Service", amount: 5800000, phone: "254799887766" },
  { id: "maint-203", propertyId: "prop-2", component: "Low-efficiency HVAC Motor Bearing Grease", status: "In-Progress", targetDate: "2026-06-02", contractor: "Fundi HVAC Technicals", amount: 75000, phone: "254705040302" },
  { id: "maint-301", propertyId: "prop-3", component: "Elevator Hoist Motor Diagnostic", status: "Completed", targetDate: "2026-05-15", contractor: "Otis East Africa Ltd", amount: 320000, phone: "254788111222" },
  { id: "maint-302", propertyId: "prop-3", component: "Rooftop Rain Gutter Clearing", status: "Scheduled", targetDate: "2026-06-10", contractor: "Local Property Artisans Ltd", amount: 45000, phone: "254701239845" }
];

export const initialVendors: Vendor[] = [
  {
    id: "vendor-1", name: "Bamburi Special Concrete", type: "Supplier", category: "Construction Materials",
    contactPerson: "John Mwangi", email: "sales@bamburi.co.ke", phone: "+254 711 234 567",
    address: "Bamburi Industrial Area, Mombasa", contractValue: 28500000, contractExpiry: "2027-03-15",
    performanceRating: 4.7, deliveryOnTimeRate: 94, paymentTerms: "Net 30",
    complianceCertified: true, complianceExpiry: "2026-12-01",
    deliveryHistory: [
      { date: "2026-05-10", item: "Waterproofing Membrane", status: "On-Time", value: 8500000 },
      { date: "2026-04-22", item: "Structural Concrete Mix", status: "On-Time", value: 12000000 },
      { date: "2026-03-15", item: "Foundation Additives", status: "On-Time", value: 8000000 }
    ],
    paymentHistory: [
      { date: "2026-05-15", amount: 8500000, status: "Paid" },
      { date: "2026-04-30", amount: 12000000, status: "Paid" },
      { date: "2026-03-20", amount: 8000000, status: "Paid" }
    ]
  },
  {
    id: "vendor-2", name: "Otis East Africa Ltd", type: "Contractor", category: "Elevators & Mechanical",
    contactPerson: "Sarah Kamau", email: "projects@otis-ea.com", phone: "+254 722 998 877",
    address: "Industrial Area, Nairobi", contractValue: 18500000, contractExpiry: "2028-01-01",
    performanceRating: 4.9, deliveryOnTimeRate: 98, paymentTerms: "Net 45",
    complianceCertified: true, complianceExpiry: "2027-06-30",
    deliveryHistory: [
      { date: "2026-05-15", item: "Elevator Motor Diagnostic", status: "On-Time", value: 320000 },
      { date: "2024-11-05", item: "VFD Elevator Installation", status: "On-Time", value: 18500000 }
    ],
    paymentHistory: [
      { date: "2026-05-20", amount: 320000, status: "Paid" },
      { date: "2024-12-01", amount: 18500000, status: "Paid" }
    ]
  },
  {
    id: "vendor-3", name: "Davis & Shirtliff", type: "Supplier", category: "Water & Solar Systems",
    contactPerson: "Peter Otieno", email: "info@dayliff.com", phone: "+254 733 445 566",
    address: "Enterprise Road, Nairobi", contractValue: 6200000, contractExpiry: "2026-12-31",
    performanceRating: 4.5, deliveryOnTimeRate: 89, paymentTerms: "Net 30",
    complianceCertified: true, complianceExpiry: "2026-09-15",
    deliveryHistory: [
      { date: "2026-05-20", item: "Filtration System Service", status: "On-Time", value: 120000 },
      { date: "2026-05-01", item: "Solar Inverter Tune-Up", status: "On-Time", value: 180000 }
    ],
    paymentHistory: [
      { date: "2026-05-25", amount: 120000, status: "Paid" },
      { date: "2026-05-05", amount: 180000, status: "Paid" }
    ]
  },
  {
    id: "vendor-4", name: "Mabati Rolling Mills", type: "Supplier", category: "Roofing Materials",
    contactPerson: "Grace Wanjiku", email: "orders@mabati.com", phone: "+254 799 887 766",
    address: "Mlolongo, Machakos", contractValue: 5800000, contractExpiry: "2026-08-30",
    performanceRating: 3.8, deliveryOnTimeRate: 76, paymentTerms: "Net 15",
    complianceCertified: false, complianceExpiry: "2025-11-30",
    deliveryHistory: [
      { date: "2026-04-18", item: "Roofing Sheet Batch", status: "Late", value: 3200000 },
      { date: "2026-02-10", item: "Pre-Painted Alu-Zinc Sheets", status: "On-Time", value: 2600000 }
    ],
    paymentHistory: [
      { date: "2026-05-01", amount: 3200000, status: "Paid" },
      { date: "2026-02-25", amount: 2600000, status: "Paid" }
    ]
  },
  {
    id: "vendor-5", name: "Apex Fire Safety Kenya", type: "Contractor", category: "Fire Safety",
    contactPerson: "Daniel Kiprop", email: "service@apexfire.co.ke", phone: "+254 733 445 566",
    address: "Mombasa Road, Nairobi", contractValue: 2400000, contractExpiry: "2027-01-31",
    performanceRating: 4.3, deliveryOnTimeRate: 91, paymentTerms: "Net 30",
    complianceCertified: true, complianceExpiry: "2026-10-15",
    deliveryHistory: [
      { date: "2026-06-12", item: "Fire Alarm Calibration", status: "On-Time", value: 180000 }
    ],
    paymentHistory: [
      { date: "2026-06-15", amount: 180000, status: "Pending" }
    ]
  },
  {
    id: "vendor-6", name: "PowerLink Engineers Nairobi", type: "Consultant", category: "Electrical Engineering",
    contactPerson: "Faith Njeri", email: "eng@powerlink.co.ke", phone: "+254 711 223 344",
    address: "Westlands, Nairobi", contractValue: 3200000, contractExpiry: "2026-12-31",
    performanceRating: 4.6, deliveryOnTimeRate: 93, paymentTerms: "Net 45",
    complianceCertified: true, complianceExpiry: "2027-03-01",
    deliveryHistory: [
      { date: "2026-05-24", item: "DB Board Rewiring", status: "On-Time", value: 460000 }
    ],
    paymentHistory: [
      { date: "2026-05-28", amount: 460000, status: "Paid" }
    ]
  }
];

export const initialMaterials: Material[] = [
  { id: "mat-1", name: "Portland Cement (50kg)", category: "Cement & Concrete", supplier: "Bamburi Cement Ltd", manufacturer: "Bamburi", unit: "Bag", currentPrice: 850, historicalPrices: [{ date: "2026-01", price: 780 }, { date: "2026-02", price: 800 }, { date: "2026-03", price: 820 }, { date: "2026-04", price: 840 }, { date: "2026-05", price: 850 }], leadTimeDays: 3, availability: "In Stock", carbonFootprint: 0.9 },
  { id: "mat-2", name: "Reinforcement Steel (Y12)", category: "Steel & Metals", supplier: "Tata Steel Kenya", manufacturer: "Tata", unit: "Tonne", currentPrice: 92000, historicalPrices: [{ date: "2026-01", price: 88000 }, { date: "2026-02", price: 89000 }, { date: "2026-03", price: 90000 }, { date: "2026-04", price: 91000 }, { date: "2026-05", price: 92000 }], leadTimeDays: 7, availability: "In Stock", carbonFootprint: 1.8 },
  { id: "mat-3", name: "Pre-Painted Alu-Zinc Roofing", category: "Roofing", supplier: "Mabati Rolling Mills", manufacturer: "MRM", unit: "m²", currentPrice: 1450, historicalPrices: [{ date: "2026-01", price: 1300 }, { date: "2026-02", price: 1350 }, { date: "2026-03", price: 1380 }, { date: "2026-04", price: 1420 }, { date: "2026-05", price: 1450 }], leadTimeDays: 5, availability: "Low Stock", carbonFootprint: 2.1 },
  { id: "mat-4", name: "Double-Glazed Low-E Glass", category: "Glazing & Windows", supplier: "Alumil Kenya Ltd", manufacturer: "Alumil", unit: "m²", currentPrice: 8200, historicalPrices: [{ date: "2026-01", price: 7800 }, { date: "2026-02", price: 7900 }, { date: "2026-03", price: 8000 }, { date: "2026-04", price: 8100 }, { date: "2026-05", price: 8200 }], leadTimeDays: 14, availability: "Pre-Order", carbonFootprint: 1.2 },
  { id: "mat-5", name: "VFD HVAC Unit (15kW)", category: "HVAC & Mechanical", supplier: "Usoni Air Conditioning", manufacturer: "Daikin", unit: "Unit", currentPrice: 385000, historicalPrices: [{ date: "2026-01", price: 360000 }, { date: "2026-02", price: 365000 }, { date: "2026-03", price: 370000 }, { date: "2026-04", price: 375000 }, { date: "2026-05", price: 385000 }], leadTimeDays: 21, availability: "In Stock", carbonFootprint: 3.5 },
  { id: "mat-6", name: "Solar Panel (450W Monocrystalline)", category: "Renewable Energy", supplier: "Davis & Shirtliff", manufacturer: "Canadian Solar", unit: "Panel", currentPrice: 18500, historicalPrices: [{ date: "2026-01", price: 19000 }, { date: "2026-02", price: 18800 }, { date: "2026-03", price: 18700 }, { date: "2026-04", price: 18600 }, { date: "2026-05", price: 18500 }], leadTimeDays: 10, availability: "In Stock", carbonFootprint: 0.4 }
];

export const initialAssets: Asset[] = [
  { id: "asset-1", propertyId: "prop-1", name: "Rooftop Solar Array (45kW)", category: "Solar Installations", installationDate: "2025-06-15", expectedLifespan: 25, warrantyInfo: "10-year manufacturer warranty", vendor: "Davis & Shirtliff", maintenanceSchedule: "Quarterly", currentCondition: "Good", replacementCost: 4500000, remainingUsefulLife: 24, maintenanceHistory: [{ date: "2026-05-01", description: "Inverter tune-up and panel cleaning", cost: 180000 }] },
  { id: "asset-2", propertyId: "prop-1", name: "Greywater Filtration System", category: "Water Systems", installationDate: "2025-03-20", expectedLifespan: 15, warrantyInfo: "5-year parts warranty", vendor: "Davis & Shirtliff", maintenanceSchedule: "Monthly", currentCondition: "Good", replacementCost: 1800000, remainingUsefulLife: 14, maintenanceHistory: [{ date: "2026-05-20", description: "Filtration flushing and media replacement", cost: 120000 }] },
  { id: "asset-3", propertyId: "prop-1", name: "Smart Security Gate System", category: "Security Systems", installationDate: "2025-08-10", expectedLifespan: 10, warrantyInfo: "2-year full coverage", vendor: "Security Group Africa", maintenanceSchedule: "Bi-Annually", currentCondition: "New", replacementCost: 850000, remainingUsefulLife: 10 },
  { id: "asset-4", propertyId: "prop-2", name: "Standard HVAC Motor Bank (Block A-C)", category: "HVAC Systems", installationDate: "2025-04-01", expectedLifespan: 8, warrantyInfo: "1-year limited warranty", vendor: "Usoni Air Conditioning", maintenanceSchedule: "Monthly", currentCondition: "Fair", replacementCost: 9800000, remainingUsefulLife: 7, maintenanceHistory: [{ date: "2026-06-02", description: "Motor bearing grease and filter replacement", cost: 75000 }] },
  { id: "asset-5", propertyId: "prop-2", name: "Corrugated Roofing (3 Blocks)", category: "Roofing", installationDate: "2025-02-15", expectedLifespan: 5, warrantyInfo: "No warranty (economy grade)", vendor: "Local Roofing Wholesalers", maintenanceSchedule: "Annually", currentCondition: "Poor", replacementCost: 5800000, remainingUsefulLife: 2, maintenanceHistory: [{ date: "2026-05-18", description: "Emergency patchwork and sealant application", cost: 850000 }] },
  { id: "asset-6", propertyId: "prop-2", name: "Electrical DB Board (Main)", category: "Electrical Infrastructure", installationDate: "2025-03-10", expectedLifespan: 20, warrantyInfo: "3-year parts warranty", vendor: "PowerLink Engineers", maintenanceSchedule: "Annually", currentCondition: "Good", replacementCost: 1200000, remainingUsefulLife: 19, maintenanceHistory: [{ date: "2026-05-24", description: "Emergency rewiring after overload", cost: 460000 }] },
  { id: "asset-7", propertyId: "prop-3", name: "VFD Elevator System (2 Units)", category: "Elevators", installationDate: "2024-11-05", expectedLifespan: 30, warrantyInfo: "15-year extended warranty", vendor: "Otis East Africa Ltd", maintenanceSchedule: "Quarterly", currentCondition: "Good", replacementCost: 18500000, remainingUsefulLife: 28, maintenanceHistory: [{ date: "2026-05-15", description: "Hoist motor diagnostic and cable inspection", cost: 320000 }] },
  { id: "asset-8", propertyId: "prop-3", name: "Automated LED Grid System", category: "Electrical Infrastructure", installationDate: "2024-08-20", expectedLifespan: 12, warrantyInfo: "5-year warranty", vendor: "Philips Kenya", maintenanceSchedule: "Bi-Annually", currentCondition: "New", replacementCost: 2400000, remainingUsefulLife: 11 },
  { id: "asset-9", propertyId: "prop-3", name: "Rooftop Rainwater Harvesting", category: "Water Systems", installationDate: "2024-09-15", expectedLifespan: 20, warrantyInfo: "10-year structural warranty", vendor: "Davis & Shirtliff", maintenanceSchedule: "Bi-Annually", currentCondition: "Good", replacementCost: 950000, remainingUsefulLife: 18 }
];

export const initialMaintenanceRecords: MaintenanceRecord[] = [
  { id: "mr-1", propertyId: "prop-1", assetId: "asset-2", type: "Preventive", cost: 120000, vendor: "Davis & Shirtliff", date: "2026-05-20", status: "Completed", notes: "Scheduled filtration media replacement and system flush", technician: "Peter Otieno", downtime: 2, partsUsed: "Filter media, O-rings", labourHours: 4, attachments: [] },
  { id: "mr-2", propertyId: "prop-1", assetId: "asset-1", type: "Preventive", cost: 180000, vendor: "Davis & Shirtliff", date: "2026-05-01", status: "Completed", notes: "Quarterly inverter calibration and panel cleaning", technician: "Peter Otieno", downtime: 1, partsUsed: "Cleaning solution", labourHours: 6, attachments: [] },
  { id: "mr-3", propertyId: "prop-2", assetId: "asset-5", type: "Corrective", cost: 850000, vendor: "Apex Roofing Kenya", date: "2026-05-18", status: "Completed", notes: "Emergency leak repair after storm damage to Block B roofing", technician: "James Mwangi", downtime: 8, partsUsed: "Mastic sealant, epoxy, patch sheets", labourHours: 16, attachments: [] },
  { id: "mr-4", propertyId: "prop-2", assetId: "asset-4", type: "Predictive", cost: 75000, vendor: "Fundi HVAC Technicals", date: "2026-06-02", status: "In-Progress", notes: "Bearing vibration detected via sensor - proactive grease before failure", technician: "Ali Hassan", downtime: 0, partsUsed: "High-temp grease", labourHours: 3, attachments: [] },
  { id: "mr-5", propertyId: "prop-3", assetId: "asset-7", type: "Preventive", cost: 320000, vendor: "Otis East Africa Ltd", date: "2026-05-15", status: "Completed", notes: "Quarterly hoist motor diagnostic and cable fatigue assessment", technician: "Sarah Kamau", downtime: 4, partsUsed: "Lubricants", labourHours: 8, attachments: [] },
  { id: "mr-6", propertyId: "prop-3", type: "Emergency", cost: 145000, vendor: "Local Property Artisans", date: "2026-04-28", status: "Completed", notes: "Emergency water pump replacement after sudden failure", technician: "Local team", downtime: 6, partsUsed: "Replacement pump", labourHours: 5, attachments: [] }
];

export const initialCompliance: ComplianceItem[] = [
  { id: "comp-1", propertyId: "prop-1", regulation: "Nairobi County Building Permit", category: "Building Codes", status: "Compliant", lastInspectionDate: "2025-06-10", nextInspectionDate: "2027-06-10", authority: "Nairobi City County", notes: "All structural approvals obtained. Phase 1 certificate issued." },
  { id: "comp-2", propertyId: "prop-1", regulation: "Fire Safety Certificate", category: "Fire Safety", status: "Pending Review", lastInspectionDate: "2026-05-01", nextInspectionDate: "2026-06-12", authority: "Kenya Fire Brigade", notes: "Alarm calibration scheduled. Awaiting final inspection." },
  { id: "comp-3", propertyId: "prop-1", regulation: "Environmental Impact Assessment", category: "Environmental", status: "Compliant", lastInspectionDate: "2025-01-20", nextInspectionDate: "2027-01-20", authority: "NEMA Kenya", notes: "EIA license issued. Rainwater harvesting system approved." },
  { id: "comp-4", propertyId: "prop-2", regulation: "OSHA Workplace Safety Audit", category: "OSHA", status: "Non-Compliant", lastInspectionDate: "2026-03-15", nextInspectionDate: "2026-07-01", authority: "DOSH Kenya", notes: "Failed audit: missing PPE compliance logs and emergency exit signage." },
  { id: "comp-5", propertyId: "prop-2", regulation: "Structural Integrity Inspection", category: "Structural Inspection", status: "Pending Review", lastInspectionDate: "2026-04-20", nextInspectionDate: "2026-07-15", authority: "Kenya Society of Engineers", notes: "Roof structural assessment pending after corrosion discovery." },
  { id: "comp-6", propertyId: "prop-3", regulation: "Annual Fire Safety Inspection", category: "Fire Safety", status: "Compliant", lastInspectionDate: "2026-04-05", nextInspectionDate: "2027-04-05", authority: "Kenya Fire Brigade", notes: "All systems operational. Certificate renewed." },
  { id: "comp-7", propertyId: "prop-3", regulation: "Energy Efficiency Compliance", category: "Environmental", status: "Compliant", lastInspectionDate: "2026-02-18", nextInspectionDate: "2027-02-18", authority: "Energy Regulatory Commission", notes: "LED automation and solar contribution exceed minimum standards." },
  { id: "comp-8", propertyId: "prop-3", regulation: "Elevator Safety Certification", category: "Building Codes", status: "Compliant", lastInspectionDate: "2026-05-15", nextInspectionDate: "2026-08-15", authority: "Kenya Bureau of Standards", notes: "VFD elevators passed all safety checks." }
];

export const initialSustainability: SustainabilityMetric[] = [
  { id: "sus-1", propertyId: "prop-1", month: "Jan", electricityKwh: 4200, waterLitres: 85000, carbonEmissionsKg: 2100, renewableEnergyKwh: 1800, wasteGeneratedKg: 450, greenBuildingScore: 78 },
  { id: "sus-2", propertyId: "prop-1", month: "Feb", electricityKwh: 3800, waterLitres: 78000, carbonEmissionsKg: 1900, renewableEnergyKwh: 2100, wasteGeneratedKg: 380, greenBuildingScore: 80 },
  { id: "sus-3", propertyId: "prop-1", month: "Mar", electricityKwh: 3500, waterLitres: 72000, carbonEmissionsKg: 1750, renewableEnergyKwh: 2400, wasteGeneratedKg: 350, greenBuildingScore: 82 },
  { id: "sus-4", propertyId: "prop-1", month: "Apr", electricityKwh: 3200, waterLitres: 68000, carbonEmissionsKg: 1600, renewableEnergyKwh: 2600, wasteGeneratedKg: 320, greenBuildingScore: 84 },
  { id: "sus-5", propertyId: "prop-1", month: "May", electricityKwh: 2900, waterLitres: 65000, carbonEmissionsKg: 1450, renewableEnergyKwh: 2800, wasteGeneratedKg: 290, greenBuildingScore: 86 },
  { id: "sus-6", propertyId: "prop-2", month: "Jan", electricityKwh: 12500, waterLitres: 120000, carbonEmissionsKg: 6250, renewableEnergyKwh: 0, wasteGeneratedKg: 980, greenBuildingScore: 42 },
  { id: "sus-7", propertyId: "prop-2", month: "Feb", electricityKwh: 13200, waterLitres: 128000, carbonEmissionsKg: 6600, renewableEnergyKwh: 0, wasteGeneratedKg: 1050, greenBuildingScore: 40 },
  { id: "sus-8", propertyId: "prop-2", month: "Mar", electricityKwh: 14100, waterLitres: 135000, carbonEmissionsKg: 7050, renewableEnergyKwh: 0, wasteGeneratedKg: 1120, greenBuildingScore: 38 },
  { id: "sus-9", propertyId: "prop-2", month: "Apr", electricityKwh: 14800, waterLitres: 142000, carbonEmissionsKg: 7400, renewableEnergyKwh: 0, wasteGeneratedKg: 1180, greenBuildingScore: 36 },
  { id: "sus-10", propertyId: "prop-2", month: "May", electricityKwh: 15500, waterLitres: 150000, carbonEmissionsKg: 7750, renewableEnergyKwh: 0, wasteGeneratedKg: 1250, greenBuildingScore: 34 },
  { id: "sus-11", propertyId: "prop-3", month: "Jan", electricityKwh: 6800, waterLitres: 95000, carbonEmissionsKg: 3400, renewableEnergyKwh: 1200, wasteGeneratedKg: 620, greenBuildingScore: 68 },
  { id: "sus-12", propertyId: "prop-3", month: "Feb", electricityKwh: 6400, waterLitres: 92000, carbonEmissionsKg: 3200, renewableEnergyKwh: 1400, wasteGeneratedKg: 580, greenBuildingScore: 70 },
  { id: "sus-13", propertyId: "prop-3", month: "Mar", electricityKwh: 6100, waterLitres: 88000, carbonEmissionsKg: 3050, renewableEnergyKwh: 1600, wasteGeneratedKg: 540, greenBuildingScore: 71 },
  { id: "sus-14", propertyId: "prop-3", month: "Apr", electricityKwh: 5800, waterLitres: 84000, carbonEmissionsKg: 2900, renewableEnergyKwh: 1800, wasteGeneratedKg: 510, greenBuildingScore: 73 },
  { id: "sus-15", propertyId: "prop-3", month: "May", electricityKwh: 5500, waterLitres: 80000, carbonEmissionsKg: 2750, renewableEnergyKwh: 2000, wasteGeneratedKg: 480, greenBuildingScore: 75 }
];

export const initialPredictions: AIPrediction[] = [
  { id: "pred-1", propertyId: "prop-1", category: "Maintenance Cost", prediction: "Q3 2026 maintenance costs projected to decrease 8% due to solar system efficiency gains", predictedValue: 1100000, confidenceScore: 87, riskLevel: "Low", recommendation: "Continue quarterly inverter maintenance schedule. No action needed.", supportingData: "5-month downward trend in maintenance invoices. Solar output increasing 12% MoM.", timeframe: "Q3 2026" },
  { id: "pred-2", propertyId: "prop-1", category: "Utility Consumption", prediction: "Grid power dependency to drop 22% as solar capacity reaches peak output", predictedValue: 350000, confidenceScore: 91, riskLevel: "Low", recommendation: "Consider enrolling in KPLC Net Metering Phase II for excess energy credits.", supportingData: "Solar generation up 15% QoQ. Battery storage utilization at 78%.", timeframe: "Next 3 months" },
  { id: "pred-3", propertyId: "prop-2", category: "Equipment Failure", prediction: "HVAC Motor Bank failure probability at 73% within 90 days without intervention", predictedValue: 73, confidenceScore: 84, riskLevel: "High", recommendation: "Schedule immediate bearing replacement and VFD retrofit to prevent catastrophic failure.", supportingData: "Vibration sensors show 40% increase. Bearing temperature trending up 3°C/week.", timeframe: "90 days" },
  { id: "pred-4", propertyId: "prop-2", category: "Budget Overrun", prediction: "Annual OPEX to exceed budget by 31% driven by roof replacement and energy penalties", predictedValue: 7440000, confidenceScore: 89, riskLevel: "Critical", recommendation: "Approve emergency CAPEX for Alu-Zinc roof replacement and power factor correction capacitors.", supportingData: "OPEX running 28% above budget YTD. Trend accelerating.", timeframe: "FY 2026" },
  { id: "pred-5", propertyId: "prop-3", category: "Asset Replacement", prediction: "Elevator hoist cables require replacement within 14 months at current duty cycle", predictedValue: 14, confidenceScore: 82, riskLevel: "Medium", recommendation: "Schedule cable replacement during June 2027 maintenance window. Budget KSh 2.8M.", supportingData: "850,000 duty cycles logged. Fatigue indicators at 88% of warning threshold.", timeframe: "14 months" },
  { id: "pred-6", propertyId: "prop-3", category: "Operating Cost", prediction: "Annual operating costs stable with 3% projected increase from inflation", predictedValue: 18540000, confidenceScore: 93, riskLevel: "Low", recommendation: "No action required. Continue current efficiency programs.", supportingData: "5-month stable trend. LED automation reducing lighting costs 18%.", timeframe: "FY 2026" }
];

export const initialAnomalies: Anomaly[] = [
  { id: "anom-1", propertyId: "prop-2", category: "Utility Spike", description: "HVAC energy consumption increased by 27% compared to 3-month baseline", severity: "High", detectedValue: 15500, expectedValue: 12200, deviationPercent: 27, recommendation: "Inspect compressor efficiency and refrigerant pressure. Consider VFD retrofit to eliminate inductive load penalties.", detectedAt: "2026-05-20", isResolved: false },
  { id: "anom-2", propertyId: "prop-2", category: "Maintenance Overrun", description: "Roof maintenance costs 340% above historical average for this asset class", severity: "Critical", detectedValue: 850000, expectedValue: 250000, deviationPercent: 240, recommendation: "Replace economy-grade corrugated roofing with pre-painted Alu-Zinc. Patchwork is no longer cost-effective.", detectedAt: "2026-05-18", isResolved: false },
  { id: "anom-3", propertyId: "prop-2", category: "Vendor Overcharging", description: "Mabati Rolling Mills pricing 12% above market average for equivalent gauge", severity: "Medium", detectedValue: 1450, expectedValue: 1295, deviationPercent: 12, recommendation: "Solicit competitive quotes from Safal Group and Royal Mabati for next procurement cycle.", detectedAt: "2026-05-15", isResolved: false },
  { id: "anom-4", propertyId: "prop-3", category: "Energy Wastage", description: "Off-hours electricity consumption 18% higher than expected baseline", severity: "Medium", detectedValue: 2200, expectedValue: 1860, deviationPercent: 18, recommendation: "Review automated lighting schedules. Adjust motion sensor sensitivity in low-traffic zones.", detectedAt: "2026-05-22", isResolved: false },
  { id: "anom-5", propertyId: "prop-1", category: "Water Leak", description: "Water usage 8% below predicted baseline - potential sensor calibration issue", severity: "Low", detectedValue: 65000, expectedValue: 70500, deviationPercent: 8, recommendation: "Verify water meter calibration. Positive deviation may indicate rainwater harvesting offset working correctly.", detectedAt: "2026-05-25", isResolved: true }
];

export const initialRisks: RiskItem[] = [
  { id: "risk-1", propertyId: "prop-2", description: "Catastrophic roof failure during wet season causing inventory water damage", category: "Structural", probability: "High", impact: "Critical", mitigation: "Approve emergency CAPEX for full Alu-Zinc roof replacement before long rains", status: "Open" },
  { id: "risk-2", propertyId: "prop-2", description: "HVAC motor failure causing tenant evacuation and business interruption", category: "Operational", probability: "High", impact: "High", mitigation: "Schedule VFD retrofit and bearing replacement within 30 days", status: "Open" },
  { id: "risk-3", propertyId: "prop-3", description: "Elevator cable failure causing safety incident and liability exposure", category: "Operational", probability: "Medium", impact: "Critical", mitigation: "Pre-order replacement cables. Schedule during June 2027 maintenance window", status: "Mitigated" },
  { id: "risk-4", propertyId: "prop-2", description: "OSHA non-compliance fines and potential operational shutdown", category: "Compliance", probability: "Medium", impact: "High", mitigation: "Complete PPE compliance logs and install emergency exit signage before July audit", status: "Open" },
  { id: "risk-5", propertyId: "prop-1", description: "Construction cost overrun exceeding 10% of CAPEX budget", category: "Financial", probability: "Low", impact: "Medium", mitigation: "Maintain current procurement discipline. Weekly budget review meetings", status: "Closed" }
];

export const initialNotifications: AppNotification[] = [
  { id: "notif-1", propertyId: "prop-2", title: "Critical: HVAC Motor Failure Risk", message: "AI predicts 73% failure probability within 90 days. Schedule VFD retrofit immediately.", type: "equipment", severity: "critical", timestamp: "2026-05-20T08:00:00Z", isRead: false, channel: "both" },
  { id: "notif-2", propertyId: "prop-2", title: "Budget Threshold Exceeded", message: "OPEX running 31% above annual budget. Emergency review required.", type: "budget", severity: "critical", timestamp: "2026-05-18T14:30:00Z", isRead: false, channel: "both" },
  { id: "notif-3", propertyId: "prop-2", title: "Roof Replacement Scheduled", message: "Full roofing replacement scheduled for July 15, 2026. Budget KSh 5.8M approved.", type: "maintenance", severity: "high", timestamp: "2026-05-15T10:00:00Z", isRead: false, channel: "in-app" },
  { id: "notif-4", propertyId: "prop-3", title: "Elevator Cable Fatigue Warning", message: "Hoist cables at 88% fatigue threshold. Replacement needed within 14 months.", type: "ai_recommendation", severity: "medium", timestamp: "2026-05-12T09:15:00Z", isRead: true, channel: "in-app" },
  { id: "notif-5", propertyId: "prop-1", title: "Fire Safety Inspection Due", message: "Fire alarm calibration inspection scheduled for June 12, 2026.", type: "compliance", severity: "medium", timestamp: "2026-05-10T11:00:00Z", isRead: true, channel: "in-app" },
  { id: "notif-6", propertyId: "prop-2", title: "Vendor Contract Expiring", message: "Mabati Rolling Mills contract expires August 30, 2026. Review renewal terms.", type: "contract", severity: "low", timestamp: "2026-05-08T16:00:00Z", isRead: true, channel: "in-app" },
  { id: "notif-7", propertyId: "prop-3", title: "Insurance Policy Renewal", message: "UAP Old Mutual policy expires June 9, 2026. Initiate renewal process.", type: "warranty", severity: "high", timestamp: "2026-05-05T08:00:00Z", isRead: false, channel: "both" }
];

export const getFinancialTrends = (propertyId: string): ChartDataPoint[] => {
  if (propertyId === "prop-1") {
    return [
      { month: "Jan", capexBudget: 4000000, capexActual: 4200000, opexBudget: 500000, opexActual: 410000 },
      { month: "Feb", capexBudget: 3500000, capexActual: 3300000, opexBudget: 500000, opexActual: 430000 },
      { month: "Mar", capexBudget: 3000000, capexActual: 2900000, opexBudget: 500000, opexActual: 420000 },
      { month: "Apr", capexBudget: 2500000, capexActual: 2600000, opexBudget: 500000, opexActual: 450000 },
      { month: "May", capexBudget: 1500000, capexActual: 1400000, opexBudget: 500000, opexActual: 390000 },
      { month: "Jun", capexBudget: 1000000, capexActual: 1050000, opexBudget: 500000, opexActual: 400000 }
    ];
  } else if (propertyId === "prop-2") {
    return [
      { month: "Jan", capexBudget: 3000000, capexActual: 2700000, opexBudget: 800000, opexActual: 1400000 },
      { month: "Feb", capexBudget: 2500000, capexActual: 2400000, opexBudget: 800000, opexActual: 1650000 },
      { month: "Mar", capexBudget: 2000000, capexActual: 1900000, opexBudget: 800000, opexActual: 1800000 },
      { month: "Apr", capexBudget: 1500000, capexActual: 1450000, opexBudget: 800000, opexActual: 1950000 },
      { month: "May", capexBudget: 1000000, capexActual: 950000, opexBudget: 1000000, opexActual: 2150000 },
      { month: "Jun", capexBudget: 500000, capexActual: 620000, opexBudget: 1000000, opexActual: 2850000 }
    ];
  } else {
    return [
      { month: "Jan", capexBudget: 5000000, capexActual: 5100000, opexBudget: 600000, opexActual: 580000 },
      { month: "Feb", capexBudget: 4200000, capexActual: 4000000, opexBudget: 600000, opexActual: 610000 },
      { month: "Mar", capexBudget: 3800000, capexActual: 3750000, opexBudget: 600000, opexActual: 620000 },
      { month: "Apr", capexBudget: 2200000, capexActual: 2400000, opexBudget: 600000, opexActual: 650000 },
      { month: "May", capexBudget: 1500000, capexActual: 1550000, opexBudget: 600000, opexActual: 670000 },
      { month: "Jun", capexBudget: 900000, capexActual: 850000, opexBudget: 600000, opexActual: 600000 }
    ];
  }
};

export const getAIInsights = (propertyId: string): AIInsight[] => {
  if (propertyId === "prop-1") {
    return [
      { type: "opportunity", title: "Rainwater Buffer Maximization", description: "Severe rain predicted in Nairobi over the next 18 days. Greywater filtration is operating at optimal efficiency.", financialImpact: "Saves KSh 140,000 in backup municipal water delivery", recommendedAction: "Bypass secondary high-filtration cycles next week to expand buffer tanks." },
      { type: "opportunity", title: "Solar Excess Energy Offloading", description: "Your grid exports on high solar radiation afternoons average 15 kW/hr above base operational loads.", financialImpact: "Generate KSh 45,000 monthly utility credits", recommendedAction: "Enroll in Net Metering Scheme Phase II with Kenya Power & Lighting (KPLC)." }
    ];
  } else if (propertyId === "prop-2") {
    return [
      { type: "alert", title: "Vicious Utility Load-Factor Chargeback", description: "Low-grade non-VFD ventilation motors are causing a inductive power factor of 0.72. KPLC is applying reactive penalization multipliers.", financialImpact: "Inflating electricity bills by KSh 380,000 monthly", recommendedAction: "Retrofit reactive power capacitor banks (Est. CAPEX KSh 1.2M, payback in 3.1 months)." },
      { type: "warning", title: "Accelerated Roof Sheet Oxidization", description: "Sub-standard roofing sheets in Block B are showing rapid corrosion. Micro-cracks detected during thermal sweeps.", financialImpact: "Failure creates risk of KSh 6,500,000 structural & inventory water damage", recommendedAction: "Replace degraded sheets with premium prepainted standard gauge zinc-aluminum alloys (Alu-Zinc)." }
    ];
  } else {
    return [
      { type: "warning", title: "Pre-emptive Elevator Cable Fatigue", description: "Block A Elevator runs have exceeded 850,000 duty cycles. Traction fatigue indicators approaching warning threshold of 88%.", financialImpact: "Avoids emergency callout surcharge of KSh 220,000", recommendedAction: "Engage Otis East Africa for replacement during scheduled June downtime." },
      { type: "opportunity", title: "Smart Thermostat Cluster Integration", description: "Sub-blocks show high temperature fluctuation during Nairobi's dry season, triggering heating-cooling overlaps.", financialImpact: "Saves KSh 90,000 in monthly building operational logs", recommendedAction: "Deploy smart centralized climate clusters to regulate zones automatically." }
    ];
  }
};

export const initialSystemSettings: SystemSettings = {
  safetyMargin: 20,
  aiModel: "gemini-2.0-flash",
  notificationChannels: {
    inApp: true,
    email: true,
    sms: false
  },
  auditLogs: [
    { id: "log-1", timestamp: "2026-07-04T08:00:00Z", userId: "user-admin", userName: "Abdulwahab Wandera", role: "Developer", action: "System Login", details: "Administrator logged into platform dashboard" },
    { id: "log-2", timestamp: "2026-07-04T07:30:00Z", userId: "user-manager", userName: "Kamau Njoroge", role: "Facility Manager", action: "Maintenance Update", details: "Updated maintenance task status for Thika Road Commercial Park", propertyId: "prop-2" },
    { id: "log-3", timestamp: "2026-07-03T16:45:00Z", userId: "user-admin", userName: "Abdulwahab Wandera", role: "Developer", action: "Settings Change", details: "Adjusted safety margin from KSh 15 to KSh 20" },
    { id: "log-4", timestamp: "2026-07-03T14:20:00Z", userId: "user-engineer", userName: "Jane Atieno", role: "Maintenance Engineer", action: "Asset Inspection", details: "Completed HVAC motor bearing inspection at Thika Road Commercial Park", propertyId: "prop-2" }
  ]
};
