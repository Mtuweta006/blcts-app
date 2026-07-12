import React, { useState, useEffect, useCallback } from "react";
import { Calculator, Building2, Upload, CircleCheck as CheckCircle2, Circle, ChevronRight, TriangleAlert as AlertTriangle, FileText, Layers, TrendingUp, RefreshCw, Download, MapPin, FileSliders as Sliders, Info, ZapOff, Cpu, ChartBar as BarChart2, DollarSign, ChevronDown, ChevronUp, Eye, Printer } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { Property } from "../types";
import {
  getCostConfigFromStorage, setCostConfigToStorage,
  CostEstimateConfig, DEFAULT_CONFIG, formatKSh, getAllCounties
} from "../utils/pricingEngine";
import {
  calculateFullBOQ, FullBOQResult, CONSTRUCTION_RATES_PER_SQM
} from "../utils/boqEngine";
import {
  fetchRegionalPricing, getBOQEstimatesForProperty,
  saveBOQEstimate, BOQEstimateRow, RegionalPricingRow
} from "../lib/supabase";
import { WorkflowStepper } from "./WorkflowComponents";
import type { BlueprintAnalysisResult } from "./PropertyManagement";

interface CostEstimationProps {
  selectedProperty: Property;
  blueprintAnalysis?: BlueprintAnalysisResult | null;
  triggerToast?: (msg: string, type?: "success" | "info" | "warning") => void;
}

type WorkflowStage =
  | "project-details"
  | "upload-drawings"
  | "validation"
  | "ocr-analysis"
  | "extract-info"
  | "calc-gfa"
  | "building-type"
  | "finish-standard"
  | "regional-prices"
  | "labour-rates"
  | "qs-calc"
  | "generate-boq"
  | "estimate-cost"
  | "lifecycle-cost"
  | "engineering-report"
  | "download";

const WORKFLOW_STAGES: { id: WorkflowStage; label: string }[] = [
  { id: "project-details",   label: "Project Details" },
  { id: "upload-drawings",   label: "Upload Drawings" },
  { id: "validation",        label: "Validation" },
  { id: "ocr-analysis",      label: "OCR / Image Analysis" },
  { id: "extract-info",      label: "Extract Building Info" },
  { id: "calc-gfa",          label: "Calculate GFA" },
  { id: "building-type",     label: "Building Type" },
  { id: "finish-standard",   label: "Finish Standard" },
  { id: "regional-prices",   label: "Regional Material Prices" },
  { id: "labour-rates",      label: "Labour Rates" },
  { id: "qs-calc",           label: "QS Calculations" },
  { id: "generate-boq",      label: "Generate BOQ" },
  { id: "estimate-cost",     label: "Estimate Construction Cost" },
  { id: "lifecycle-cost",    label: "Lifecycle Cost Analysis" },
  { id: "engineering-report","label": "Engineering Report" },
  { id: "download",          label: "Download Report" },
];

const STAGE_ORDER = WORKFLOW_STAGES.map(s => s.id);
const PIE_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

function stageStatus(stageId: WorkflowStage, activeStage: WorkflowStage, boq: FullBOQResult | null): "completed" | "active" | "pending" {
  const ai = STAGE_ORDER.indexOf(activeStage);
  const si = STAGE_ORDER.indexOf(stageId);
  if (si < ai) return "completed";
  if (si === ai) return "active";
  return "pending";
}

function fmtK(v: number) {
  if (v >= 1e9) return `KSh ${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `KSh ${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `KSh ${(v / 1e3).toFixed(0)}K`;
  return `KSh ${v.toFixed(0)}`;
}

export default function CostEstimation({ selectedProperty, blueprintAnalysis: blueprintAnalysisProp, triggerToast }: CostEstimationProps) {
  const [config, setConfig] = useState<CostEstimateConfig>(() => getCostConfigFromStorage());
  const [county, setCounty]           = useState(selectedProperty?.county || "Nairobi");
  const [manualArea, setManualArea]   = useState(selectedProperty?.estimatedFloorArea || 300);
  const [manualFloors, setManualFloors] = useState(selectedProperty?.floors || 1);
  const [useManual, setUseManual]     = useState(false);
  const [buildingType, setBuildingType] = useState(selectedProperty?.type || "Residential");
  const [boq, setBoq]                 = useState<FullBOQResult | null>(null);
  const [activeStage, setActiveStage] = useState<WorkflowStage>("project-details");
  const [loading, setLoading]         = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [regionalRows, setRegionalRows] = useState<RegionalPricingRow[]>([]);
  const [savedEstimates, setSavedEstimates] = useState<BOQEstimateRow[]>([]);
  const [showConfig, setShowConfig]   = useState(false);
  const [showBOQ, setShowBOQ]         = useState(true);
  const [showLifecycle, setShowLifecycle] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab]     = useState<"summary" | "boq" | "lifecycle" | "report">("summary");

  // Blueprint analysis data passed from PropertyManagement (via property fields)
  // blueprintAnalysis comes from App.tsx state (set by PropertyManagement after AI confirmation)
  // Falls back to reading observations from the property object for backward compatibility
  const blueprintAnalysis = blueprintAnalysisProp ?? (selectedProperty?.observations?.length
    ? {
        observations: selectedProperty.observations,
        estimatedFloorArea: selectedProperty.estimatedFloorArea,
        floors: selectedProperty.floors,
        buildingType: selectedProperty.type,
        confidence: null as number | null,
        isFallback: false,
      }
    : null);

  // Load regional pricing from Supabase on mount
  useEffect(() => {
    fetchRegionalPricing().then(rows => {
      if (rows.length) setRegionalRows(rows);
    });
  }, []);

  // Load saved estimates for this property
  useEffect(() => {
    if (!selectedProperty?.id) return;
    getBOQEstimatesForProperty(selectedProperty.id).then(setSavedEstimates);
  }, [selectedProperty?.id]);

  // Sync county & building type when property changes
  useEffect(() => {
    setCounty(selectedProperty?.county || "Nairobi");
    setBuildingType(selectedProperty?.type || "Residential");
    const area = selectedProperty?.estimatedFloorArea || 300;
    const floors = selectedProperty?.floors || 1;
    setManualArea(area);
    setManualFloors(floors);
    if (selectedProperty?.observations?.length && area > 0) {
      setActiveStage("calc-gfa");
    } else {
      setActiveStage("project-details");
    }
    setBoq(null);
  }, [selectedProperty?.id]);

  // If property has blueprint data, advance to GFA stage
  useEffect(() => {
    if (blueprintAnalysis && !blueprintAnalysis.isFallback && activeStage === "project-details") {
      setActiveStage("calc-gfa");
    }
  }, [blueprintAnalysis]);

  const LOADING_STEPS = [
    "Retrieving regional material prices from database...",
    "Retrieving county labour rates...",
    "Calculating Gross Floor Area...",
    "Deriving building type and finish standard...",
    "Running Quantity Survey calculations...",
    "Generating Bill of Quantities...",
    "Estimating construction cost...",
    "Calculating 30-year lifecycle projection...",
    "Compiling engineering report...",
  ];

  const runEstimation = useCallback(async () => {
    if (!selectedProperty) return;
    setLoading(true);
    setBoq(null);
    setLoadingStep(0);

    const area = useManual ? manualArea : (selectedProperty.estimatedFloorArea || 300);
    const floors = useManual ? manualFloors : (selectedProperty.floors || 1);

    // Animate through workflow stages while calculating
    const stageSequence: WorkflowStage[] = [
      "regional-prices","labour-rates","calc-gfa","building-type",
      "finish-standard","qs-calc","generate-boq","estimate-cost",
      "lifecycle-cost","engineering-report"
    ];

    for (let i = 0; i < stageSequence.length; i++) {
      setActiveStage(stageSequence[i]);
      setLoadingStep(i);
      await new Promise(r => setTimeout(r, 280));
    }

    const result = calculateFullBOQ(
      buildingType, floors, area,
      selectedProperty.opexBudget || 0,
      config, county, regionalRows.length ? regionalRows : undefined
    );

    setBoq(result);
    setActiveStage("download");
    setLoading(false);
    setActiveTab("summary");

    // Persist to Supabase
    saveBOQEstimate({
      property_id: selectedProperty.id,
      property_name: selectedProperty.name,
      county,
      building_type: buildingType,
      construction_standard: config.constructionStandard,
      gfa: result.gfa,
      floors: result.floors,
      cost_per_sqm: result.adjustedCostPerSqm,
      construction_cost: result.constructionCost,
      external_works: result.externalWorks,
      preliminaries: result.preliminaries,
      professional_fees: result.professionalFees,
      statutory_costs: result.statutoryCosts,
      subtotal: result.subtotal,
      contingency: result.contingency,
      vat_amount: result.vatAmount,
      total_project_cost: result.totalProjectCost,
      lifecycle_years: result.lifecycleYears,
      annual_opex: result.annualOpex,
      total_lifecycle_cost: result.totalLifecycleCost,
      tco: result.tco,
      boq_line_items: result.lineItems,
      blueprint_observations: selectedProperty.observations || [],
      ai_confidence: blueprintAnalysis?.confidence ?? null,
      config: config as unknown as Record<string, unknown>,
    }).then(() => {
      getBOQEstimatesForProperty(selectedProperty.id).then(setSavedEstimates);
    });

    triggerToast?.("BOQ estimate generated and saved.", "success");
  }, [selectedProperty, useManual, manualArea, manualFloors, buildingType, config, county, regionalRows, blueprintAnalysis]);

  function updateConfig(updates: Partial<CostEstimateConfig>) {
    const next = { ...config, ...updates };
    setConfig(next);
    setCostConfigToStorage(next);
  }

  function exportBOQCSV() {
    if (!boq) return;
    const rows = [
      ["Section", "Item", "Quantity", "Unit", "Unit Rate (KSh)", "Amount (KSh)", "Source"],
      ...boq.lineItems.map(l => [l.section, l.item, l.quantity, l.unit, l.unitRate, l.amount, l.source]),
      [],
      ["", "Construction Cost", "", "", "", boq.constructionCost, ""],
      ["", "External Works", "", "", "", boq.externalWorks, ""],
      ["", "Preliminaries", "", "", "", boq.preliminaries, ""],
      ...boq.professionalFees.map(f => ["", f.name, "", "", `${(f.rate*100).toFixed(1)}%`, f.amount, ""]),
      ["", "Statutory Costs", "", "", "", boq.statutoryCosts, ""],
      ["", "Contingency", "", "", "", boq.contingency, ""],
      ["", "VAT (16%)", "", "", "", boq.vatAmount, ""],
      ["", "TOTAL PROJECT COST", "", "", "", boq.totalProjectCost, ""],
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BOQ_${selectedProperty?.name?.replace(/\s+/g, "_") || "project"}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast?.("BOQ exported as CSV.", "success");
  }

  function exportReport() {
    if (!boq) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const esc = (s: string) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const boqRows = boq.lineItems.map(l =>
      `<tr><td>${esc(l.section)}</td><td>${l.quantity.toFixed(1)}</td><td>${esc(l.unit)}</td><td>${l.unitRate.toLocaleString()}</td><td>${l.amount.toLocaleString()}</td><td><span style="font-size:9px;background:#e2e8f0;padding:1px 6px;border-radius:9px">${esc(l.source)}</span></td></tr>`
    ).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>BLCTS Engineering Report</title>
<style>body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;max-width:900px;margin:40px auto;padding:20px}
h1{color:#065f46;font-size:20px;border-bottom:3px solid #10b981;padding-bottom:8px}
h2{color:#0f172a;font-size:14px;border-left:4px solid #10b981;padding-left:8px;margin-top:20px}
table{width:100%;border-collapse:collapse;margin-top:8px}
th{background:#f1f5f9;text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
td{padding:5px 8px;border-bottom:1px solid #e2e8f0}
.total{font-weight:bold;font-size:13px;background:#f0fdf4}
.kpi{display:inline-block;margin:4px 8px 4px 0;background:#f8fafc;border:1px solid #e2e8f0;padding:6px 12px;border-radius:6px}
.kpi-label{font-size:10px;color:#64748b;text-transform:uppercase}
.kpi-val{font-size:16px;font-weight:bold;color:#0f172a}
.badge{display:inline-block;background:#dcfce7;color:#166534;font-size:9px;padding:1px 6px;border-radius:9px;font-weight:bold}
@media print{body{margin:0;padding:10px}}
</style></head><body>
<h1>BLCTS Engineering Estimate Report</h1>
<p><strong>Project:</strong> ${esc(selectedProperty?.name || "")}</p>
<p><strong>Location:</strong> ${esc(selectedProperty?.location || "")} &nbsp;|&nbsp; <strong>County:</strong> ${esc(boq.county)} &nbsp;|&nbsp; <strong>Generated:</strong> ${new Date().toLocaleString()}</p>

<h2>Building Parameters</h2>
<div>
  <span class="kpi"><div class="kpi-label">Building Type</div><div class="kpi-val">${esc(boq.buildingType)}</div></span>
  <span class="kpi"><div class="kpi-label">Standard</div><div class="kpi-val">${esc(boq.constructionStandard)}</div></span>
  <span class="kpi"><div class="kpi-label">GFA</div><div class="kpi-val">${boq.gfa.toLocaleString()} m²</div></span>
  <span class="kpi"><div class="kpi-label">Floors</div><div class="kpi-val">${boq.floors}</div></span>
  <span class="kpi"><div class="kpi-label">Cost/m²</div><div class="kpi-val">KSh ${boq.adjustedCostPerSqm.toLocaleString()}</div></span>
  <span class="kpi"><div class="kpi-label">County Multiplier</div><div class="kpi-val">${boq.countyMultiplier.toFixed(2)}×</div></span>
</div>

${blueprintAnalysis ? `
<h2>Blueprint Analysis (AI-Assisted)</h2>
<p><strong>Confidence:</strong> ${blueprintAnalysis.confidence != null ? (blueprintAnalysis.confidence * 100).toFixed(0) + "%" : "Not available"}</p>
<ul>${(blueprintAnalysis.observations || []).map(o => `<li>${esc(o)}</li>`).join("")}</ul>
<p><em>Note: AI-extracted dimensions are marked as "estimated". Quantities requiring professional survey are noted.</em></p>
` : ""}

<h2>Bill of Quantities</h2>
<table>
  <tr><th>Section</th><th>Qty</th><th>Unit</th><th>Unit Rate (KSh)</th><th>Amount (KSh)</th><th>Basis</th></tr>
  ${boqRows}
</table>

<h2>Cost Summary</h2>
<table>
  <tr><td>Construction Cost</td><td style="text-align:right">${boq.constructionCost.toLocaleString()}</td></tr>
  <tr><td>External Works (${(boq.config.externalWorksRate*100).toFixed(0)}%)</td><td style="text-align:right">${boq.externalWorks.toLocaleString()}</td></tr>
  <tr><td>Preliminaries (${(boq.config.preliminariesRate*100).toFixed(0)}%)</td><td style="text-align:right">${boq.preliminaries.toLocaleString()}</td></tr>
  ${boq.professionalFees.map(f => `<tr><td>${esc(f.name)} (${(f.rate*100).toFixed(1)}%)</td><td style="text-align:right">${f.amount.toLocaleString()}</td></tr>`).join("")}
  <tr><td>Statutory Costs (${(boq.config.statutoryCostsRate*100).toFixed(1)}%)</td><td style="text-align:right">${boq.statutoryCosts.toLocaleString()}</td></tr>
  <tr><td>Subtotal</td><td style="text-align:right">${boq.subtotal.toLocaleString()}</td></tr>
  <tr><td>Contingency (${(boq.config.contingencyRate*100).toFixed(1)}%)</td><td style="text-align:right">${boq.contingency.toLocaleString()}</td></tr>
  <tr><td>VAT (${(boq.config.vatRate*100).toFixed(0)}%)</td><td style="text-align:right">${boq.vatAmount.toLocaleString()}</td></tr>
  <tr class="total"><td>TOTAL PROJECT COST</td><td style="text-align:right">${boq.totalProjectCost.toLocaleString()}</td></tr>
  <tr><td colspan="2">&nbsp;</td></tr>
  <tr><td>${boq.lifecycleYears}-Year Lifecycle Cost</td><td style="text-align:right">${boq.totalLifecycleCost.toLocaleString()}</td></tr>
  <tr class="total"><td>30-YEAR TCO</td><td style="text-align:right">${boq.tco.toLocaleString()}</td></tr>
</table>

<h2>Engineering Assumptions &amp; Limitations</h2>
<ul>
  <li>Gross Floor Area: ${boq.gfa.toLocaleString()} m² — <strong>${blueprintAnalysis && !blueprintAnalysis.isFallback ? "extracted from uploaded blueprint" : "entered manually"}</strong></li>
  <li>BOQ quantities derived from GFA ratios using standard construction proportioning norms</li>
  <li>Regional rates from BLCTS database for ${esc(boq.county)} county (multiplier: ${boq.countyMultiplier.toFixed(2)})</li>
  <li>Lifecycle OPEX assumes ${(1.5).toFixed(1)}% maintenance, ${(1.2).toFixed(1)}% utilities, ${(0.5).toFixed(1)}% insurance, ${(0.2).toFixed(1)}% inspection p.a.</li>
  <li>OPEX inflated at 6% p.a. over ${boq.lifecycleYears} years</li>
  <li>This estimate is indicative. A full Quantity Survey by a registered QS is required for procurement.</li>
</ul>
<p style="margin-top:32px;color:#64748b;font-size:10px">Generated by BLCTS — Building Lifecycle Cost Tracking System &copy; ${new Date().getFullYear()}</p>
</body></html>`);
    win.document.close();
    win.print();
  }

  const counties = getAllCounties();
  const buildingTypes = Object.keys(CONSTRUCTION_RATES_PER_SQM);
  const standards: Array<"Economy" | "Standard" | "Premium" | "Luxury"> = ["Economy", "Standard", "Premium", "Luxury"];

  const area = useManual ? manualArea : (selectedProperty?.estimatedFloorArea || 300);
  const floors = useManual ? manualFloors : (selectedProperty?.floors || 1);
  const progressPct = boq ? 100 : Math.round((STAGE_ORDER.indexOf(activeStage) / (STAGE_ORDER.length - 1)) * 100);

  // Pie chart data for construction cost breakdown
  const pieSummaryData = boq ? [
    { name: "Construction", value: boq.constructionCost },
    { name: "External Works", value: boq.externalWorks },
    { name: "Preliminaries", value: boq.preliminaries },
    { name: "Professional Fees", value: boq.totalProfessionalFees },
    { name: "Statutory", value: boq.statutoryCosts },
    { name: "Contingency", value: boq.contingency },
    { name: "VAT", value: boq.vatAmount },
  ] : [];

  return (
    <div className="space-y-6 text-left animate-fade-in">

      {/* ── WORKFLOW HEADER ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-500" />
              Construction Cost Estimation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quantity-surveying-based estimation — every calculation is transparent and traceable.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Workflow Progress</span>
              <span className="text-2xl font-black text-emerald-500">{progressPct}%</span>
            </div>
            <div className="w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${progressPct} ${100 - progressPct}`} strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* 16-step workflow stepper */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center gap-1 min-w-max">
            {WORKFLOW_STAGES.map((stage, idx) => {
              const s = stageStatus(stage.id, activeStage, boq);
              return (
                <React.Fragment key={stage.id}>
                  <div className={`flex items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    s === "completed" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-900/40"
                    : s === "active"    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 border border-blue-300 dark:border-blue-900/40 ring-1 ring-blue-300"
                    :                    "bg-slate-50 dark:bg-slate-900/40 text-slate-400 border border-slate-100 dark:border-slate-800"
                  }`}>
                    {s === "completed" ? <CheckCircle2 className="w-3 h-3 shrink-0" />
                      : s === "active" ? <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                      : <Circle className="w-3 h-3 shrink-0" />}
                    <span>{stage.label}</span>
                  </div>
                  {idx < WORKFLOW_STAGES.length - 1 && (
                    <ChevronRight className="w-2.5 h-2.5 text-slate-300 dark:text-slate-700 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Current stage indicator */}
        <div className="mt-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-2">
          <div className={`w-2 h-2 rounded-full ${loading ? "bg-blue-500 animate-pulse" : boq ? "bg-emerald-500" : "bg-slate-400"}`} />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {loading ? LOADING_STEPS[loadingStep] || "Processing..."
              : boq ? `Estimate complete — ${fmtK(boq.totalProjectCost)} total project cost`
              : `Stage: ${WORKFLOW_STAGES.find(s => s.id === activeStage)?.label || "Ready"}`}
          </span>
        </div>
      </div>

      {/* ── BLUEPRINT ANALYSIS BANNER ──────────────────────────────────── */}
      {blueprintAnalysis && (
        <div className={`rounded-xl border p-4 ${
          blueprintAnalysis.isFallback
            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
            : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
        }`}>
          <div className="flex items-start gap-3">
            <Cpu className={`w-4 h-4 mt-0.5 shrink-0 ${blueprintAnalysis.isFallback ? "text-amber-500" : "text-emerald-500"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${blueprintAnalysis.isFallback ? "text-amber-600" : "text-emerald-600"}`}>
                  {blueprintAnalysis.isFallback ? "Blueprint Analysis — Limited" : "Blueprint Analysis — Active"}
                </span>
                {blueprintAnalysis.confidence != null && (
                  <span className="text-[9px] font-bold bg-white dark:bg-slate-800 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full">
                    {(blueprintAnalysis.confidence * 100).toFixed(0)}% Confidence
                  </span>
                )}
              </div>
              <ul className="mt-1.5 space-y-0.5">
                {blueprintAnalysis.observations?.map((o, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                    <span className="text-slate-300 mt-0.5">›</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
              {blueprintAnalysis.isFallback && (
                <p className="mt-2 text-[10px] text-amber-600 font-medium">
                  AI analysis was unavailable. The values shown below are manually entered. Upload a blueprint in Projects Register to enable AI-assisted analysis.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── INPUT PARAMETERS ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            Project Parameters
          </h3>
          <button onClick={() => setShowConfig(!showConfig)}
            className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-500 flex items-center gap-1 transition-colors cursor-pointer">
            <Sliders className="w-3 h-3" />
            {showConfig ? "Hide" : "Advanced Config"}
            {showConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* County */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              <MapPin className="w-3 h-3 inline mr-1" />County
            </label>
            <select value={county} onChange={e => setCounty(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white">
              {counties.map(c => <option key={c}>{c}</option>)}
            </select>
            {regionalRows.length > 0 && (
              <div className="mt-1 text-[9px] text-emerald-500 font-bold">
                Multiplier: {regionalRows.find(r => r.county === county)?.material_multiplier?.toFixed(2) ?? "1.00"}×
              </div>
            )}
          </div>

          {/* Building type */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              <Building2 className="w-3 h-3 inline mr-1" />Building Type
            </label>
            <select value={buildingType} onChange={e => setBuildingType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white">
              {buildingTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Construction standard */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              <Layers className="w-3 h-3 inline mr-1" />Finish Standard
            </label>
            <select value={config.constructionStandard}
              onChange={e => updateConfig({ constructionStandard: e.target.value as "Economy" | "Standard" | "Premium" | "Luxury" })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white">
              {standards.map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="mt-1 text-[9px] text-slate-400 font-mono">
              KSh {((CONSTRUCTION_RATES_PER_SQM[buildingType]?.[config.constructionStandard] || 0) * (regionalRows.find(r => r.county === county)?.material_multiplier || 1)).toLocaleString()}/m²
            </div>
          </div>

          {/* Area / Override */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                GFA (m²)
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={useManual} onChange={e => setUseManual(e.target.checked)} className="w-3 h-3 accent-blue-500" />
                <span className="text-[9px] text-slate-400">Override</span>
              </label>
            </div>
            {useManual ? (
              <div className="flex gap-2">
                <input type="number" value={manualArea} onChange={e => setManualArea(Number(e.target.value))} min={10}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white"
                  placeholder="Floor area m²" />
                <input type="number" value={manualFloors} onChange={e => setManualFloors(Number(e.target.value))} min={1} max={100}
                  className="w-16 bg-slate-50 dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl px-2 py-2 text-xs font-medium text-slate-800 dark:text-white"
                  placeholder="Flrs" />
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700">
                {(area * floors).toLocaleString()} m²
                <span className="ml-1 text-[9px] font-normal text-emerald-500">
                  ({area}m² × {floors}F — {blueprintAnalysis && !blueprintAnalysis.isFallback ? "measured" : "entered"})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Advanced config panel */}
        {showConfig && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contingency %</label>
              <input type="number" value={(config.contingencyRate * 100).toFixed(1)} step="0.5" min={0} max={30}
                onChange={e => updateConfig({ contingencyRate: Number(e.target.value) / 100 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">VAT %</label>
              <input type="number" value={(config.vatRate * 100).toFixed(0)} step="1" min={0} max={25}
                onChange={e => updateConfig({ vatRate: Number(e.target.value) / 100 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ext. Works %</label>
              <input type="number" value={(config.externalWorksRate * 100).toFixed(0)} step="1" min={0} max={30}
                onChange={e => updateConfig({ externalWorksRate: Number(e.target.value) / 100 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lifecycle Yrs</label>
              <input type="number" value={config.lifecycleYears} step="5" min={1} max={60}
                onChange={e => updateConfig({ lifecycleYears: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Statutory %</label>
              <input type="number" value={(config.statutoryCostsRate * 100).toFixed(1)} step="0.5" min={0} max={10}
                onChange={e => updateConfig({ statutoryCostsRate: Number(e.target.value) / 100 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 dark:text-white" />
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button onClick={runEstimation} disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            {loading ? "Calculating..." : boq ? "Recalculate BOQ" : "Run QS Estimate"}
          </button>
          {boq && (
            <>
              <button onClick={exportBOQCSV}
                className="bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-colors flex items-center gap-2 border border-blue-200 dark:border-blue-900/40 cursor-pointer">
                <Download className="w-4 h-4" />CSV
              </button>
              <button onClick={exportReport}
                className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <Printer className="w-4 h-4" />Report
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── RESULTS ────────────────────────────────────────────────────── */}
      {boq && (
        <>
          {/* Tab navigation */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
            {(["summary","boq","lifecycle","report"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`py-2 px-4 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                  activeTab === t
                    ? "border-emerald-500 text-emerald-500"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}>
                {t === "summary" ? "Cost Summary" : t === "boq" ? "Bill of Quantities" : t === "lifecycle" ? "Lifecycle Analysis" : "Engineering Report"}
              </button>
            ))}
          </div>

          {/* ── SUMMARY TAB ─────────────────────────────────────────── */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "GFA", value: `${boq.gfa.toLocaleString()} m²`, sub: `${boq.floors} floor${boq.floors > 1 ? "s" : ""}`, color: "blue" },
                  { label: "Cost / m²", value: `KSh ${boq.adjustedCostPerSqm.toLocaleString()}`, sub: `${county} rate × ${boq.countyMultiplier.toFixed(2)}`, color: "emerald" },
                  { label: "Total Project Cost", value: fmtK(boq.totalProjectCost), sub: "incl. VAT & fees", color: "emerald" },
                  { label: `${boq.lifecycleYears}-yr TCO`, value: fmtK(boq.tco), sub: "CAPEX + lifecycle OPEX", color: "amber" },
                ].map(k => (
                  <div key={k.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</div>
                    <div className={`text-lg font-black mt-1 ${k.color === "emerald" ? "text-emerald-500" : k.color === "blue" ? "text-blue-500" : "text-amber-500"}`}>{k.value}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Cost breakdown table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Cost Breakdown — Every Line Transparent</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Item</th>
                        <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Formula</th>
                        <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Amount (KSh)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      <tr>
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">Construction Cost</td>
                        <td className="px-4 py-2.5 text-right text-[9px] font-mono text-slate-400">{boq.gfa.toLocaleString()}m² × KSh{boq.adjustedCostPerSqm.toLocaleString()}/m²</td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-slate-800 dark:text-white">{boq.constructionCost.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">External Works</td>
                        <td className="px-4 py-2.5 text-right text-[9px] font-mono text-slate-400">{(boq.config.externalWorksRate*100).toFixed(0)}% of construction</td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-slate-800 dark:text-white">{boq.externalWorks.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">Preliminaries</td>
                        <td className="px-4 py-2.5 text-right text-[9px] font-mono text-slate-400">{(boq.config.preliminariesRate*100).toFixed(0)}% of construction</td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-slate-800 dark:text-white">{boq.preliminaries.toLocaleString()}</td>
                      </tr>
                      {boq.professionalFees.map(f => (
                        <tr key={f.name}>
                          <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 pl-8">{f.name}</td>
                          <td className="px-4 py-2.5 text-right text-[9px] font-mono text-slate-400">{(f.rate*100).toFixed(1)}% of construction</td>
                          <td className="px-4 py-2.5 text-right text-xs text-slate-600 dark:text-slate-400">{f.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">Statutory Costs</td>
                        <td className="px-4 py-2.5 text-right text-[9px] font-mono text-slate-400">{(boq.config.statutoryCostsRate*100).toFixed(1)}% of construction</td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-slate-800 dark:text-white">{boq.statutoryCosts.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                        <td className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">Subtotal</td>
                        <td className="px-4 py-2.5 text-right text-[9px] font-mono text-slate-400">sum of above</td>
                        <td className="px-4 py-2.5 text-right text-xs font-black text-slate-800 dark:text-white">{boq.subtotal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">Contingency</td>
                        <td className="px-4 py-2.5 text-right text-[9px] font-mono text-slate-400">{(boq.config.contingencyRate*100).toFixed(1)}% of subtotal</td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-slate-800 dark:text-white">{boq.contingency.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">VAT ({(boq.config.vatRate*100).toFixed(0)}%)</td>
                        <td className="px-4 py-2.5 text-right text-[9px] font-mono text-slate-400">{(boq.config.vatRate*100).toFixed(0)}% of pre-VAT total</td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-slate-800 dark:text-white">{boq.vatAmount.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-emerald-50 dark:bg-emerald-950/20">
                        <td className="px-4 py-3 text-sm font-black text-emerald-700 dark:text-emerald-400">TOTAL PROJECT COST</td>
                        <td className="px-4 py-3 text-right text-[9px] font-mono text-emerald-500">Grand Total</td>
                        <td className="px-4 py-3 text-right text-sm font-black text-emerald-600 dark:text-emerald-400">{boq.totalProjectCost.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-amber-50 dark:bg-amber-950/20">
                        <td className="px-4 py-3 text-sm font-black text-amber-700 dark:text-amber-400">{boq.lifecycleYears}-Year TCO</td>
                        <td className="px-4 py-3 text-right text-[9px] font-mono text-amber-500">CAPEX + OPEX</td>
                        <td className="px-4 py-3 text-right text-sm font-black text-amber-600 dark:text-amber-400">{boq.tco.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pie chart */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Cost Distribution</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieSummaryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                        {pieSummaryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `KSh ${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── BOQ TAB ──────────────────────────────────────────────── */}
          {activeTab === "boq" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Bill of Quantities — Detailed Breakdown</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">All quantities derived from GFA = {boq.gfa.toLocaleString()} m² ({boq.floors} floors × {(boq.gfa / boq.floors).toFixed(0)} m² per floor)</p>
                </div>
                <button onClick={exportBOQCSV}
                  className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/30 text-blue-500 border border-blue-200 dark:border-blue-900/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer">
                  <Download className="w-3 h-3" />Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Section</th>
                      <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                      <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                      <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Rate (KSh)</th>
                      <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Amount (KSh)</th>
                      <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">% of Total</th>
                      <th className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {boq.lineItems.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">{l.section}</td>
                        <td className="px-4 py-2.5 text-right text-xs font-mono text-slate-600 dark:text-slate-400">{l.quantity.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-slate-500">{l.unit}</td>
                        <td className="px-4 py-2.5 text-right text-xs font-mono text-slate-600 dark:text-slate-400">{l.unitRate.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-slate-800 dark:text-white">{l.amount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-xs font-mono text-slate-400">
                          {((l.amount / boq.constructionCost) * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            l.source === "measured" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                            : "bg-amber-50 dark:bg-amber-950/30 text-amber-600"
                          }`}>
                            {l.source}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 dark:bg-emerald-950/20">
                      <td className="px-4 py-3 text-xs font-black text-emerald-700 dark:text-emerald-400" colSpan={4}>Construction Cost Subtotal</td>
                      <td className="px-4 py-3 text-right text-xs font-black text-emerald-600 dark:text-emerald-400">{boq.constructionCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-emerald-500">100%</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/10 border-t border-blue-100 dark:border-blue-900/30">
                <p className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">
                  <Info className="w-3 h-3 inline mr-1" />
                  Quantities are derived from GFA using standard construction proportioning ratios. Each section's unit rate reflects the section's share of the total construction cost divided by its estimated quantity.
                  A full QS survey would provide individually measured quantities from drawings.
                </p>
              </div>
            </div>
          )}

          {/* ── LIFECYCLE TAB ─────────────────────────────────────────── */}
          {activeTab === "lifecycle" && (
            <div className="space-y-4">
              {/* OPEX KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Annual Maintenance", value: fmtK(boq.annualMaintenance), pct: "1.5%" },
                  { label: "Annual Utilities", value: fmtK(boq.annualUtilities), pct: "1.2%" },
                  { label: "Annual Insurance", value: fmtK(boq.annualInsurance), pct: "0.5%" },
                  { label: "Annual Inspections", value: fmtK(boq.annualInspection), pct: "0.2%" },
                ].map(k => (
                  <div key={k.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</div>
                    <div className="text-lg font-black text-blue-500 mt-1">{k.value}</div>
                    <div className="text-[9px] text-slate-400">{k.pct} of construction cost p.a.</div>
                  </div>
                ))}
              </div>

              {/* Cumulative lifecycle area chart */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">{boq.lifecycleYears}-Year Cumulative Cost Projection</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={boq.yearlyProjection.filter((_, i) => i % Math.max(1, Math.floor(boq.lifecycleYears / 15)) === 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                      <YAxis tickFormatter={v => `${(v/1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => `KSh ${v.toLocaleString()}`} labelFormatter={l => `Year ${l}`} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Area type="monotone" dataKey="cumulative" stroke="#10b981" fill="#d1fae5" strokeWidth={2} name="Cumulative TCO" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Annual OPEX breakdown bar chart */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Annual OPEX Breakdown (with 6% inflation)</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={boq.yearlyProjection.filter((_, i) => i % Math.max(1, Math.floor(boq.lifecycleYears / 10)) === 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={v => `${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => `KSh ${v.toLocaleString()}`} labelFormatter={l => `Year ${l}`} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="maintenance" name="Maintenance" fill="#10b981" stackId="a" />
                      <Bar dataKey="utilities" name="Utilities" fill="#0ea5e9" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* TCO summary */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6">
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Total Cost of Ownership Summary</h3>
                <div className="space-y-2">
                  {[
                    { label: "CAPEX (Total Project Cost)", value: boq.totalProjectCost },
                    { label: `OPEX (${boq.lifecycleYears}-yr cumulative, 6% inflation)`, value: boq.totalLifecycleCost },
                    { label: `${boq.lifecycleYears}-Year TCO`, value: boq.tco, highlight: true },
                  ].map(row => (
                    <div key={row.label} className={`flex items-center justify-between py-2 border-b border-emerald-100 dark:border-emerald-900/20 ${row.highlight ? "font-black" : "font-medium"}`}>
                      <span className={`text-xs ${row.highlight ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}>{row.label}</span>
                      <span className={`text-sm font-black ${row.highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white"}`}>
                        {fmtK(row.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ENGINEERING REPORT TAB ────────────────────────────────── */}
          {activeTab === "report" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Engineering Estimate Report</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">Transparency disclosure — confidence, evidence, assumptions, limitations</p>
                </div>
                <button onClick={exportReport}
                  className="text-[9px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer">
                  <Printer className="w-3 h-3" />Print / PDF
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Detected parameters */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Detected / Confirmed Parameters</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Building Type", value: boq.buildingType, source: blueprintAnalysis && !blueprintAnalysis.isFallback ? "AI-extracted" : "Manually entered" },
                      { label: "Floors", value: `${boq.floors}`, source: blueprintAnalysis && !blueprintAnalysis.isFallback ? "AI-extracted" : "Manually entered" },
                      { label: "GFA", value: `${boq.gfa.toLocaleString()} m²`, source: blueprintAnalysis && !blueprintAnalysis.isFallback ? "AI-measured" : "Manually entered" },
                      { label: "Construction Standard", value: boq.constructionStandard, source: "User selected" },
                      { label: "County", value: boq.county, source: "Property record" },
                      { label: "Cost / m²", value: `KSh ${boq.adjustedCostPerSqm.toLocaleString()}`, source: `DB rate × ${boq.countyMultiplier.toFixed(2)} county factor` },
                    ].map(p => (
                      <div key={p.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{p.label}</div>
                        <div className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{p.value}</div>
                        <div className="text-[9px] text-emerald-500 mt-0.5">{p.source}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confidence & evidence */}
                {blueprintAnalysis && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">AI Analysis — Confidence & Evidence</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider w-24">Confidence</span>
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: blueprintAnalysis.confidence != null ? `${blueprintAnalysis.confidence * 100}%` : "0%" }} />
                        </div>
                        <span className="text-xs font-bold text-emerald-500">
                          {blueprintAnalysis.confidence != null ? `${(blueprintAnalysis.confidence * 100).toFixed(0)}%` : "N/A"}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Observations from Blueprint</div>
                        {blueprintAnalysis.observations?.length ? (
                          <ul className="space-y-1">
                            {blueprintAnalysis.observations.map((o, i) => (
                              <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                                <span className="text-emerald-400 mt-0.5">›</span><span>{o}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400">No observations available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Assumptions */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Engineering Assumptions</h4>
                  <ul className="space-y-1.5">
                    {[
                      `GFA of ${boq.gfa.toLocaleString()} m² used — ${blueprintAnalysis && !blueprintAnalysis.isFallback ? "extracted from uploaded blueprint" : "entered manually; upload blueprint for AI measurement"}`,
                      `BOQ quantities derived using standard construction proportioning norms (not individual measurement)`,
                      `Regional cost multiplier of ${boq.countyMultiplier.toFixed(2)}× applied for ${boq.county} county`,
                      `OPEX assumed as 3.4% of construction cost per annum (maintenance 1.5%, utilities 1.2%, insurance 0.5%, inspection 0.2%)`,
                      `OPEX inflated at 6.0% per annum compound over ${boq.lifecycleYears} years`,
                      `Professional fees based on NCA Kenya standard scale of charges`,
                    ].map((a, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5 shrink-0">○</span><span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />Limitations & Missing Information
                  </h4>
                  <ul className="space-y-1.5">
                    {[
                      "This is a budgetary estimate, not a firm contract price",
                      "Quantities are GFA-proportioned, not individually measured from drawings",
                      "Site conditions (soil, topography, access) not accounted for",
                      "Structural design not reviewed — column/foundation sizes assumed standard",
                      "MEP specifications not detailed — estimate uses GFA-based allowances",
                      "Material prices are database rates — actual tender prices may vary ±15–25%",
                      "A full Quantity Survey by a registered QS is required for procurement",
                    ].map((l, i) => (
                      <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">!</span><span>{l}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ESTIMATE HISTORY ───────────────────────────────────────────── */}
      {savedEstimates.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Estimate History ({savedEstimates.length})
            </span>
            {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showHistory && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <th className="text-left px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Standard</th>
                    <th className="text-right px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">GFA</th>
                    <th className="text-right px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Cost</th>
                    <th className="text-right px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">TCO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {savedEstimates.slice(0, 10).map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2 text-xs text-slate-500">{new Date(e.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300">{e.construction_standard}</td>
                      <td className="px-4 py-2 text-right text-xs font-mono text-slate-600 dark:text-slate-400">{e.gfa.toLocaleString()} m²</td>
                      <td className="px-4 py-2 text-right text-xs font-bold text-emerald-600">{fmtK(e.total_project_cost)}</td>
                      <td className="px-4 py-2 text-right text-xs font-bold text-amber-600">{fmtK(e.tco)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── EMPTY STATE ────────────────────────────────────────────────── */}
      {!boq && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <Calculator className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">No Estimate Generated Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Configure the parameters above and click <strong>Run QS Estimate</strong> to generate a transparent Bill of Quantities with full lifecycle cost analysis.
          </p>
          {!blueprintAnalysis && (
            <p className="text-xs text-amber-500 mt-3 font-medium">
              Tip: Upload an architectural drawing in <strong>Projects Register</strong> to enable AI-assisted GFA extraction.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
