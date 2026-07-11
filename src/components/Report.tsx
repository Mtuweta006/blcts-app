import React, { useMemo, useState } from "react";
import { FileText, TrendingUp, Layers, Calendar, ChevronDown, ChevronRight, Download, FileSpreadsheet, Printer, Building2, Wrench, Brain, Lightbulb, ShieldCheck, TriangleAlert as AlertTriangle, Activity, CircleDollarSign, ClipboardList } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Property,
  CostEntry,
  MaintenanceTask,
  AIPrediction,
  Anomaly,
  ComplianceItem,
  SustainabilityMetric,
  Vendor,
  Asset,
} from "../types";

const escapeHtml = (str: string): string =>
  String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

interface ReportsProps {
  selectedProperty: Property;
  costEntries: CostEntry[];
  maintenanceTasks: MaintenanceTask[];
  calculations: { capex: number; opex: number; tco: number; entryCount: number };
  predictions?: AIPrediction[];
  anomalies?: Anomaly[];
  compliance?: ComplianceItem[];
  sustainability?: SustainabilityMetric[];
  vendors?: Vendor[];
  assets?: Asset[];
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
}

const PHASE_COLORS: Record<string, string> = {
  Construction: "#10b981",
  Operational: "#0ea5e9",
  Maintenance: "#f59e0b",
  "End-of-Life": "#ef4444",
};

const formatKSh = (value: number): string => {
  if (Math.abs(value) >= 1_000_000_000) {
    return `KSh ${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `KSh ${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `KSh ${(value / 1_000).toFixed(1)}K`;
  }
  return `KSh ${value.toLocaleString()}`;
};

const formatKShFull = (value: number): string => `KSh ${value.toLocaleString()}`;

const severityColor = (sev: string): string => {
  switch (sev) {
    case "Critical":
      return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/50";
    case "High":
      return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
    case "Medium":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
    case "Low":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50";
    default:
      return "bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800";
  }
};

const conditionColor = (cond: string): string => {
  switch (cond) {
    case "New":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50";
    case "Good":
      return "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900/50";
    case "Fair":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
    case "Poor":
      return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
    case "Critical":
      return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/50";
    default:
      return "bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800";
  }
};

interface SectionProps {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ id, title, icon: Icon, iconColor, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      id={id}
      className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-[0_1px_5px_rgba(0,0,0,0.01)] overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        aria-expanded={open}
        aria-controls={`${id}-body`}
      >
        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>
      {open && (
        <div id={`${id}-body`} className="px-6 pb-6 pt-1 space-y-4">
          {children}
        </div>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
        {label}
      </span>
      <span
        className={`text-lg font-black font-mono mt-1 block ${
          accent ?? "text-slate-900 dark:text-white"
        }`}
      >
        {value}
      </span>
      {sub && <span className="text-[10px] text-slate-400 mt-0.5 block">{sub}</span>}
    </div>
  );
}

export default function Report({
  selectedProperty,
  costEntries,
  maintenanceTasks,
  calculations,
  predictions = [],
  anomalies = [],
  compliance = [],
  sustainability = [],
  vendors = [],
  assets = [],
  triggerToast,
}: ReportsProps) {
  const [exporting, setExporting] = useState(false);

  // ---- Derived data -------------------------------------------------------

  const phaseBreakdown = useMemo(() => {
    const phases: Record<string, number> = {
      Construction: 0,
      Operational: 0,
      Maintenance: 0,
      "End-of-Life": 0,
    };
    costEntries.forEach((e) => {
      if (phases[e.phase] !== undefined) phases[e.phase] += e.amount;
    });
    return Object.entries(phases)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [costEntries]);

  const costTrendData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    costEntries.forEach((e) => {
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      byMonth[key] = (byMonth[key] ?? 0) + e.amount;
    });
    return Object.entries(byMonth)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        const [ma, ya] = a.month.split(" ");
        const [mb, yb] = b.month.split(" ");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.indexOf(ma) + parseInt(ya) * 12 - (months.indexOf(mb) + parseInt(yb) * 12);
      });
  }, [costEntries]);

  const maintenanceSummary = useMemo(() => {
    const total = maintenanceTasks.reduce((s, t) => s + (t.estimatedCost || 0), 0);
    const byStatus: Record<string, number> = {};
    maintenanceTasks.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    });
    return { total, byStatus, count: maintenanceTasks.length };
  }, [maintenanceTasks]);

  const complianceScore = useMemo(() => {
    if (compliance.length === 0) return 0;
    const compliant = compliance.filter((c) => c.status === "Compliant").length;
    return Math.round((compliant / compliance.length) * 100);
  }, [compliance]);

  const riskItems = useMemo(() => {
    const items: {
      description: string;
      category: string;
      severity: string;
      source: string;
      mitigation: string;
    }[] = [];
    anomalies.forEach((a) => {
      items.push({
        description: a.description,
        category: a.category,
        severity: a.severity,
        source: "Anomaly Detection",
        mitigation: a.recommendation,
      });
    });
    predictions
      .filter((p) => p.riskLevel === "High" || p.riskLevel === "Critical")
      .forEach((p) => {
        items.push({
          description: p.prediction,
          category: p.category,
          severity: p.riskLevel,
          source: "AI Prediction",
          mitigation: p.recommendation,
        });
      });
    return items;
  }, [anomalies, predictions]);

  const budgetUtilization = useMemo(() => {
    const budget = (selectedProperty.capexBudget || 0) + (selectedProperty.opexBudget || 0);
    if (budget <= 0) return 0;
    return Math.min(100, Math.round((calculations.tco / budget) * 100));
  }, [selectedProperty, calculations.tco]);

  // ---- Export helpers -----------------------------------------------------

  const buildCSV = (): string => {
    const rows: string[][] = [];
    const esc = (v: string | number | undefined | null | boolean): string => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const add = (r: (string | number | undefined | null | boolean)[]) =>
      rows.push(r.map((c) => esc(c)));

    add(["BUILDING LIFECYCLE COST TRACKING SYSTEM — REPORT"]);
    add(["Generated", new Date().toLocaleString()]);
    add([]);
    add(["PROPERTY OVERVIEW"]);
    add(["Name", esc(selectedProperty.name)]);
    add(["Location", esc(selectedProperty.location)]);
    add(["Type", esc(selectedProperty.type)]);
    add(["Health Grade", esc(selectedProperty.healthGrade)]);
    add(["Health Status", esc(selectedProperty.healthStatusText)]);
    add(["CAPEX Budget", selectedProperty.capexBudget || 0]);
    add(["OPEX Budget", selectedProperty.opexBudget || 0]);
    add(["Description", esc(selectedProperty.description)]);
    add([]);

    add(["KEY METRICS"]);
    add(["CAPEX", calculations.capex]);
    add(["OPEX", calculations.opex]);
    add(["TCO", calculations.tco]);
    add(["Cost Entry Count", calculations.entryCount]);
    add(["Budget Utilization %", budgetUtilization]);
    add([]);

    add(["COST ENTRIES"]);
    add(["Date", "Phase", "Component", "Amount", "Contractor", "Status", "Description"]);
    costEntries.forEach((e) =>
      add([esc(e.date), esc(e.phase), esc(e.component), e.amount, esc(e.contractor), esc(e.status), esc(e.description)]),
    );
    add([]);

    add(["ASSETS"]);
    add(["Name", "Category", "Condition", "Replacement Cost", "Remaining Life (yrs)", "Vendor"]);
    assets.forEach((a) =>
      add([esc(a.name), esc(a.category), esc(a.currentCondition), a.replacementCost, a.remainingUsefulLife ?? "N/A", esc(a.vendor)]),
    );
    add([]);

    add(["MAINTENANCE TASKS"]);
    add(["Component", "Status", "Target Date", "Contractor", "Amount"]);
    maintenanceTasks.forEach((t) =>
      add([esc(t.component), esc(t.status), esc(t.targetDate), esc(t.vendor), t.estimatedCost]),
    );
    add([]);

    add(["AI PREDICTIONS"]);
    add(["Category", "Prediction", "Predicted Value", "Confidence", "Risk Level", "Timeframe", "Recommendation"]);
    predictions.forEach((p) =>
      add([esc(p.category), esc(p.prediction), p.predictedValue, p.confidenceScore, esc(p.riskLevel), esc(p.timeframe), esc(p.recommendation)]),
    );
    add([]);

    add(["ANOMALIES"]);
    add(["Category", "Description", "Severity", "Detected Value", "Expected Value", "Deviation %", "Recommendation", "Resolved"]);
    anomalies.forEach((a) =>
      add([esc(a.category), esc(a.description), esc(a.severity), a.detectedValue, a.expectedValue, a.deviationPercent, esc(a.recommendation), a.isResolved ? "Yes" : "No"]),
    );
    add([]);

    add(["COMPLIANCE"]);
    add(["Regulation", "Category", "Status", "Last Inspection", "Next Inspection", "Authority", "Notes"]);
    compliance.forEach((c) =>
      add([esc(c.regulation), esc(c.category), esc(c.status), esc(c.lastInspectionDate), esc(c.nextInspectionDate), esc(c.authority), esc(c.notes)]),
    );
    add([]);

    add(["VENDORS"]);
    add(["Name", "Type", "Category", "Contact", "Contract Value", "Performance Rating", "Compliance Certified"]);
    vendors.forEach((v) =>
      add([esc(v.name), esc(v.type), esc(v.category), esc(v.contactPerson), v.contractValue, v.performanceRating, v.complianceCertified ? "Yes" : "No"]),
    );
    add([]);

    add(["SUSTAINABILITY METRICS"]);
    add(["Month", "Electricity (kWh)", "Water (L)", "Carbon (kg)", "Renewable (kWh)", "Waste (kg)", "Green Score"]);
    sustainability.forEach((s) =>
      add([esc(s.month), s.electricityKwh, s.waterLitres, s.carbonEmissionsKg, s.renewableEnergyKwh, s.wasteGeneratedKg, s.greenBuildingScore]),
    );

    return rows.map((r) => r.join(",")).join("\n");
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportCSV = () => {
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      downloadFile(`BLCTS_Report_${selectedProperty.name}_${stamp}.csv`, buildCSV(), "text/csv;charset=utf-8;");
      triggerToast("CSV report exported successfully", "success");
    } catch (err) {
            triggerToast("Failed to export CSV", "warning");
    }
  };

  const handleExportExcel = () => {
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      // Prepend BOM so Excel detects UTF-8 and renders KSh correctly
      const content = "\uFEFF" + buildCSV();
      downloadFile(`BLCTS_Report_${selectedProperty.name}_${stamp}.xls`, content, "application/vnd.ms-excel");
      triggerToast("Excel report exported successfully", "success");
    } catch (err) {
            triggerToast("Failed to export Excel", "warning");
    }
  };

  const handleExportPDF = () => {
    try {
      setExporting(true);
      const printWin = window.open("", "_blank", "width=900,height=700");
      if (!printWin) {
        triggerToast("Pop-up blocked. Please allow pop-ups to export PDF.", "warning");
        setExporting(false);
        return;
      }

      const phaseRows = phaseBreakdown
        .map(
          (p) =>
            `<tr><td>${escapeHtml(p.name)}</td><td style="text-align:right">${formatKShFull(p.value)}</td></tr>`,
        )
        .join("");

      const assetRows = (assets.length ? assets : [])
        .map(
          (a) =>
            `<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.category)}</td><td>${escapeHtml(a.currentCondition)}</td><td style="text-align:right">${formatKShFull(a.replacementCost)}</td><td style="text-align:right">${a.remainingUsefulLife ?? "N/A"}</td></tr>`,
        )
        .join("");

      const maintRows = maintenanceTasks
        .map(
          (t) =>
            `<tr><td>${escapeHtml(t.component)}</td><td>${escapeHtml(t.status)}</td><td>${escapeHtml(t.targetDate)}</td><td style="text-align:right">${formatKShFull(t.estimatedCost)}</td></tr>`,
        )
        .join("");

      const predRows = predictions
        .map(
          (p) =>
            `<tr><td>${escapeHtml(p.category)}</td><td>${escapeHtml(p.prediction)}</td><td style="text-align:right">${formatKShFull(p.predictedValue)}</td><td>${p.confidenceScore}%</td><td>${escapeHtml(p.riskLevel)}</td><td>${escapeHtml(p.timeframe)}</td></tr>`,
        )
        .join("");

      const anomalyRows = anomalies
        .map(
          (a) =>
            `<tr><td>${escapeHtml(a.category)}</td><td>${escapeHtml(a.description)}</td><td>${escapeHtml(a.severity)}</td><td style="text-align:right">${a.deviationPercent}%</td><td>${escapeHtml(a.recommendation)}</td></tr>`,
        )
        .join("");

      const complianceRows = compliance
        .map(
          (c) =>
            `<tr><td>${escapeHtml(c.regulation)}</td><td>${escapeHtml(c.category)}</td><td>${escapeHtml(c.status)}</td><td>${escapeHtml(c.nextInspectionDate)}</td><td>${escapeHtml(c.authority)}</td></tr>`,
        )
        .join("");

      const riskRows = riskItems
        .map(
          (r) =>
            `<tr><td>${escapeHtml(r.category)}</td><td>${escapeHtml(r.description)}</td><td>${escapeHtml(r.severity)}</td><td>${escapeHtml(r.source)}</td><td>${escapeHtml(r.mitigation)}</td></tr>`,
        )
        .join("");

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>BLCTS Report — ${escapeHtml(selectedProperty.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; color: #047857; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; border-bottom: 2px solid #10b981; padding-bottom: 6px; margin: 28px 0 12px; }
  .sub { color: #64748b; font-size: 12px; margin-bottom: 4px; }
  .meta { color: #94a3b8; font-size: 11px; margin-bottom: 24px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .kpi .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
  .kpi .value { font-size: 18px; font-weight: 800; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
  th { background: #f1f5f9; text-align: left; padding: 8px; border: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase; color: #475569; }
  td { padding: 8px; border: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .score { font-size: 32px; font-weight: 800; color: #047857; }
  .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { margin: 16px; } }
</style>
</head>
<body>
  <h1>Building Lifecycle Cost Tracking System</h1>
  <div class="sub"><strong>${escapeHtml(selectedProperty.name)}</strong> — ${escapeHtml(selectedProperty.location)} (${escapeHtml(selectedProperty.type)})</div>
  <div class="meta">Generated ${new Date().toLocaleString()} • Health: ${escapeHtml(selectedProperty.healthGrade)} (${escapeHtml(selectedProperty.healthStatusText)})</div>

  <h2>Executive Summary</h2>
  <div class="kpis">
    <div class="kpi"><div class="label">CAPEX</div><div class="value">${formatKShFull(calculations.capex)}</div></div>
    <div class="kpi"><div class="label">OPEX</div><div class="value">${formatKShFull(calculations.opex)}</div></div>
    <div class="kpi"><div class="label">TCO</div><div class="value">${formatKShFull(calculations.tco)}</div></div>
    <div class="kpi"><div class="label">Budget Utilization</div><div class="value">${budgetUtilization}%</div></div>
  </div>
  <p class="sub">${escapeHtml(selectedProperty.description || "No description available.")}</p>

  <h2>Financial Analysis — Cost by Phase</h2>
  <table><thead><tr><th>Phase</th><th style="text-align:right">Amount</th></tr></thead><tbody>${phaseRows || '<tr><td colspan="2">No data</td></tr>'}</tbody></table>

  <h2>Asset Status</h2>
  <table><thead><tr><th>Name</th><th>Category</th><th>Condition</th><th style="text-align:right">Replacement Cost</th><th style="text-align:right">Remaining Life (yrs)</th></tr></thead><tbody>${assetRows || '<tr><td colspan="5">No assets recorded</td></tr>'}</tbody></table>

  <h2>Maintenance Analysis</h2>
  <p class="sub">Total maintenance cost: <strong>${formatKShFull(maintenanceSummary.total)}</strong> across ${maintenanceSummary.count} tasks.</p>
  <table><thead><tr><th>Component</th><th>Status</th><th>Target Date</th><th style="text-align:right">Amount</th></tr></thead><tbody>${maintRows || '<tr><td colspan="4">No maintenance tasks</td></tr>'}</tbody></table>

  <h2>Forecasts — AI Predictions</h2>
  <table><thead><tr><th>Category</th><th>Prediction</th><th style="text-align:right">Predicted Value</th><th>Confidence</th><th>Risk</th><th>Timeframe</th></tr></thead><tbody>${predRows || '<tr><td colspan="6">No predictions available</td></tr>'}</tbody></table>

  <h2>AI Recommendations — Anomalies</h2>
  <table><thead><tr><th>Category</th><th>Description</th><th>Severity</th><th style="text-align:right">Deviation</th><th>Recommendation</th></tr></thead><tbody>${anomalyRows || '<tr><td colspan="5">No anomalies detected</td></tr>'}</tbody></table>

  <h2>Compliance</h2>
  <p class="sub">Compliance score: <span class="score">${complianceScore}%</span></p>
  <table><thead><tr><th>Regulation</th><th>Category</th><th>Status</th><th>Next Inspection</th><th>Authority</th></tr></thead><tbody>${complianceRows || '<tr><td colspan="5">No compliance items</td></tr>'}</tbody></table>

  <h2>Risk Assessment</h2>
  <table><thead><tr><th>Category</th><th>Description</th><th>Severity</th><th>Source</th><th>Mitigation</th></tr></thead><tbody>${riskRows || '<tr><td colspan="5">No risk items identified</td></tr>'}</tbody></table>

  <div class="footer">BLCTS — Building Lifecycle Cost Tracking System • Confidential • Generated automatically</div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      triggerToast("PDF view opened — use your browser's print dialog to save as PDF", "info");
    } catch (err) {
            triggerToast("Failed to generate PDF view", "warning");
    } finally {
      setExporting(false);
    }
  };

  // ---- Render -------------------------------------------------------------

  return (
    <div className="space-y-6 text-left animate-fade-in" id="reports-page">
      {/* HEADER */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Executive Reports
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Comprehensive lifecycle reporting for{" "}
              <strong className="text-slate-700 dark:text-slate-300">{selectedProperty.name}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Export PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* 1. EXECUTIVE SUMMARY */}
      <Section id="exec-summary" title="Executive Summary" icon={FileText} iconColor="text-emerald-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Property Overview
              </span>
            </div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{selectedProperty.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Location</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{selectedProperty.location}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Type</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{selectedProperty.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Health Grade</dt>
                <dd className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedProperty.healthGrade} — {selectedProperty.healthStatusText}
                </dd>
              </div>
              {selectedProperty.status && (
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{selectedProperty.status}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="CAPEX" value={formatKSh(calculations.capex)} accent="text-emerald-600 dark:text-emerald-400" />
            <MetricCard label="OPEX" value={formatKSh(calculations.opex)} accent="text-sky-600 dark:text-sky-400" />
            <MetricCard label="TCO" value={formatKSh(calculations.tco)} accent="text-slate-900 dark:text-white" />
            <MetricCard
              label="Budget Utilization"
              value={`${budgetUtilization}%`}
              sub={`${calculations.entryCount} cost entries`}
              accent={budgetUtilization > 90 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}
            />
          </div>
        </div>
        {selectedProperty.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light pt-1">
            {selectedProperty.description}
          </p>
        )}
      </Section>

      {/* 2. FINANCIAL ANALYSIS */}
      <Section id="financial" title="Financial Analysis" icon={CircleDollarSign} iconColor="text-emerald-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost by phase pie */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Cost Breakdown by Phase
            </h4>
            {phaseBreakdown.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={phaseBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                    >
                      {phaseBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={PHASE_COLORS[entry.name] ?? "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatKShFull(v)}
                      contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No cost entries recorded.
              </div>
            )}
          </div>
          {/* Cost trends area */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Cost Trends
            </h4>
            {costTrendData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={costTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      tickFormatter={(v) => formatKSh(v)}
                    />
                    <Tooltip
                      formatter={(v: number) => formatKShFull(v)}
                      contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      name="Cost"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#costGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No trend data available.
              </div>
            )}
          </div>
        </div>
        {/* Phase table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                <th className="py-2 pr-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phase</th>
                <th className="py-2 pr-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">Amount</th>
                <th className="py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {phaseBreakdown.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-slate-400">No cost entries recorded.</td>
                </tr>
              )}
              {phaseBreakdown.map((p) => {
                const total = phaseBreakdown.reduce((s, x) => s + x.value, 0);
                const share = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
                return (
                  <tr key={p.name} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PHASE_COLORS[p.name] ?? "#64748b" }}
                        />
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{p.name}</span>
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {formatKShFull(p.value)}
                    </td>
                    <td className="py-2 text-right text-slate-500 dark:text-slate-400">{share}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 3. ASSET STATUS */}
      <Section id="assets" title="Asset Status" icon={Layers} iconColor="text-sky-500" defaultOpen={false}>
        {assets.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No assets recorded for this property.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 pr-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Asset</th>
                  <th className="py-2 pr-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category</th>
                  <th className="py-2 pr-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Condition</th>
                  <th className="py-2 pr-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">Replacement Cost</th>
                  <th className="py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">Remaining Life</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-200">{a.name}</td>
                    <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{a.category}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${conditionColor(a.currentCondition)}`}>
                        {a.currentCondition}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {formatKShFull(a.replacementCost)}
                    </td>
                    <td className="py-2 text-right text-slate-500 dark:text-slate-400">
                      {a.remainingUsefulLife != null ? `${a.remainingUsefulLife} yrs` : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* 4. MAINTENANCE ANALYSIS */}
      <Section id="maintenance" title="Maintenance Analysis" icon={Wrench} iconColor="text-amber-500" defaultOpen={false}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total Cost" value={formatKSh(maintenanceSummary.total)} accent="text-amber-600 dark:text-amber-400" />
          <MetricCard label="Total Tasks" value={String(maintenanceSummary.count)} />
          <MetricCard
            label="Overdue"
            value={String(maintenanceSummary.byStatus["Overdue"] ?? 0)}
            accent={(maintenanceSummary.byStatus["Overdue"] ?? 0) > 0 ? "text-red-600 dark:text-red-400" : undefined}
          />
          <MetricCard
            label="Completed"
            value={String(maintenanceSummary.byStatus["Completed"] ?? 0)}
            accent="text-emerald-600 dark:text-emerald-400"
          />
        </div>
        {Object.keys(maintenanceSummary.byStatus).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(maintenanceSummary.byStatus).map(([status, count]) => (
              <span
                key={status}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
              >
                {status}
                <span className="font-mono text-slate-800 dark:text-slate-100">{count}</span>
              </span>
            ))}
          </div>
        )}
        {maintenanceTasks.length === 0 && (
          <p className="text-xs text-slate-400 py-2">No maintenance tasks recorded.</p>
        )}
      </Section>

      {/* 5. FORECASTS */}
      <Section id="forecasts" title="Forecasts — AI Predictions" icon={Brain} iconColor="text-emerald-500" defaultOpen={false}>
        {predictions.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No AI predictions available for this property.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {predictions.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{p.category}</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityColor(p.riskLevel)}`}>
                    {p.riskLevel}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-1">{p.prediction}</p>
                <div className="flex items-center justify-between text-[11px] mt-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Predicted: <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{formatKSh(p.predictedValue)}</span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Confidence: <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{p.confidenceScore}%</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  <span className="font-semibold">Timeframe:</span> {p.timeframe}
                </p>
                {p.recommendation && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 border-t border-slate-200 dark:border-slate-800 pt-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Recommendation:</span> {p.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 6. AI RECOMMENDATIONS */}
      <Section id="ai-recs" title="AI Recommendations — Anomalies" icon={Lightbulb} iconColor="text-amber-500" defaultOpen={false}>
        {anomalies.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No anomalies detected. Operations are within expected parameters.</p>
        ) : (
          <div className="space-y-2.5">
            {anomalies.map((a) => (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950"
              >
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityColor(a.severity)}`}>
                    <AlertTriangle className="w-3 h-3" />
                    {a.severity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{a.category}</span>
                    {a.isResolved && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">• Resolved</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 mb-1">{a.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Detected: <span className="font-mono text-slate-700 dark:text-slate-200">{a.detectedValue.toLocaleString()}</span></span>
                    <span>Expected: <span className="font-mono text-slate-700 dark:text-slate-200">{a.expectedValue.toLocaleString()}</span></span>
                    <span>Deviation: <span className="font-mono font-semibold text-red-600 dark:text-red-400">{a.deviationPercent}%</span></span>
                  </div>
                  {a.recommendation && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Action:</span> {a.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 7. COMPLIANCE */}
      <Section id="compliance" title="Compliance" icon={ShieldCheck} iconColor="text-emerald-500" defaultOpen={false}>
        <div className="flex items-center gap-4 mb-3">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${(complianceScore / 100) * 97.4} 97.4`}
                strokeLinecap="round"
                className={complianceScore >= 80 ? "text-emerald-500" : complianceScore >= 50 ? "text-amber-500" : "text-red-500"}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-800 dark:text-white">
              {complianceScore}%
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              {compliance.filter((c) => c.status === "Compliant").length} of {compliance.length} items compliant
            </p>
            <p className="mt-0.5">
              {compliance.filter((c) => c.status === "Non-Compliant").length} non-compliant •{" "}
              {compliance.filter((c) => c.status === "Pending Review").length} pending •{" "}
              {compliance.filter((c) => c.status === "Expired").length} expired
            </p>
          </div>
        </div>
        {compliance.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No compliance items recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 pr-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Regulation</th>
                  <th className="py-2 pr-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category</th>
                  <th className="py-2 pr-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</th>
                  <th className="py-2 pr-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Next Inspection</th>
                  <th className="py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Authority</th>
                </tr>
              </thead>
              <tbody>
                {compliance.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-200">{c.regulation}</td>
                    <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{c.category}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === "Compliant"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                            : c.status === "Non-Compliant"
                            ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/50"
                            : c.status === "Expired"
                            ? "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/50"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{c.nextInspectionDate}</td>
                    <td className="py-2 text-slate-500 dark:text-slate-400">{c.authority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* 8. RISK ASSESSMENT */}
      <Section id="risk" title="Risk Assessment" icon={Activity} iconColor="text-red-500" defaultOpen={false}>
        {riskItems.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No risk items identified from anomalies or predictions.</p>
        ) : (
          <div className="space-y-2.5">
            {riskItems.map((r, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950"
              >
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityColor(r.severity)}`}>
                    {r.severity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{r.category}</span>
                    <span className="text-[10px] text-slate-400">• {r.source}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 mb-1">{r.description}</p>
                  {r.mitigation && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Mitigation:</span> {r.mitigation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Footer note */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 pt-2">
        <ClipboardList className="w-3.5 h-3.5" />
        <span>
          Report generated {new Date().toLocaleString()} • BLCTS — Building Lifecycle Cost Tracking System
        </span>
      </div>
    </div>
  );
}
