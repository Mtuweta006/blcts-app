import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, TrendingUp, TrendingDown, Wallet, Building2, Sparkles, Leaf, Activity, TriangleAlert as AlertTriangle, ArrowRight, FileText, ShieldCheck, Clock, CircleCheck as CheckCircle2, Wrench, ChevronDown, ChartPie as PieChartIcon, ChartBar as BarChart3, Cpu, Calendar, CircleDollarSign, ClipboardList, Layers, MapPin } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart
} from "recharts";
import { Property, CostEntry, MaintenanceTask, AIPrediction, Anomaly, ComplianceItem, SustainabilityMetric, Asset, AppNotification, ActiveTabType, User } from "../types";
import CountUp from "./CountUp";
import { staggerContainer, fadeInUp, cardHover } from "../utils/animations";

interface OwnerDashboardProps {
  properties: Property[];
  costEntries: CostEntry[];
  maintenanceTasks: MaintenanceTask[];
  predictions: AIPrediction[];
  anomalies: Anomaly[];
  compliance: ComplianceItem[];
  sustainability: SustainabilityMetric[];
  assets: Asset[];
  notifications: AppNotification[];
  setActiveTab: (tab: ActiveTabType) => void;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
  currentUser: User | null;
}

const formatKSh = (value: number): string => {
  if (value >= 1_000_000_000) return `KSh ${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `KSh ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `KSh ${(value / 1_000).toFixed(0)}K`;
  return `KSh ${value.toLocaleString()}`;
};

const lifecyclePhases = [
  { name: "Planning", color: "bg-slate-400" },
  { name: "Design", color: "bg-indigo-400" },
  { name: "Construction", color: "bg-blue-400" },
  { name: "Operation", color: "bg-emerald-400" },
  { name: "Maintenance", color: "bg-amber-400" },
  { name: "Renovation", color: "bg-orange-400" },
  { name: "End of Life", color: "bg-rose-400" },
];

const determineActivePhase = (property: Property): number => {
  if (property.status === "Under Construction") return 2;
  if (property.status === "Active") return 3;
  if (property.status === "Planning") return 0;
  if (property.status === "Design") return 1;
  return 3;
};

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

type OwnerTab = "portfolio" | "explorer";

export default function OwnerDashboard({
  properties,
  costEntries,
  maintenanceTasks,
  predictions,
  anomalies,
  compliance,
  sustainability,
  assets,
  notifications,
  setActiveTab,
  triggerToast,
  currentUser
}: OwnerDashboardProps) {
  const [ownerTab, setOwnerTab] = useState<OwnerTab>("portfolio");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    properties[0]?.id || ""
  );
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);

  const portfolio = useMemo(() => {
    const totalCapex = properties.reduce((s, p) => s + (p.initialConstructionCost || 0) + (p.materialCost || 0) + (p.labourCost || 0), 0);
    const totalOpex = properties.reduce((s, p) => s + (p.maintenanceCost || 0) + (p.utilityCost || 0) + (p.repairCost || 0), 0);
    const totalTco = properties.reduce((s, p) =>
      s + (p.initialConstructionCost || 0) + (p.materialCost || 0) + (p.labourCost || 0) +
      (p.maintenanceCost || 0) + (p.utilityCost || 0) + (p.repairCost || 0) +
      (p.renovationCost || 0) + (p.otherCost || 0), 0);
    const totalBuildingValue = properties.reduce((s, p) => s + (p.buildingValue || 0), 0);
    const activeProjects = properties.filter(p => p.status === "Under Construction" || p.status === "Active").length;
    const criticalAlerts = anomalies.filter(a => !a.isResolved && (a.severity === "Critical" || a.severity === "High")).length;
    const complianceIssues = compliance.filter(c => c.status !== "Compliant").length;
    const avgSustainability = sustainability.length > 0
      ? Math.round(sustainability.reduce((s, m) => s + m.greenBuildingScore, 0) / sustainability.length)
      : 0;
    const avgAiConfidence = predictions.length > 0
      ? Math.round(predictions.reduce((s, p) => s + p.confidenceScore, 0) / predictions.length)
      : 0;
    const totalMaintenanceCost = maintenanceTasks.reduce((s, t) => s + t.amount, 0);
    const paidMaintenance = maintenanceTasks.filter(t => t.status === "Paid" || t.status === "Completed").length;
    const pendingMaintenance = maintenanceTasks.filter(t => t.status === "Scheduled" || t.status === "In-Progress").length;
    const avgAssetCondition = assets.length > 0
      ? Math.round((assets.filter(a => a.currentCondition === "Good" || a.currentCondition === "New").length / assets.length) * 100)
      : 0;
    const criticalAssets = assets.filter(a => a.currentCondition === "Poor" || a.currentCondition === "Critical").length;

    return {
      totalCapex, totalOpex, totalTco, totalBuildingValue, activeProjects,
      criticalAlerts, complianceIssues, avgSustainability, avgAiConfidence,
      totalMaintenanceCost, paidMaintenance, pendingMaintenance,
      avgAssetCondition, criticalAssets, propertyCount: properties.length
    };
  }, [properties, anomalies, compliance, sustainability, predictions, maintenanceTasks, assets]);

  const selectedProperty = useMemo(() =>
    properties.find(p => p.id === selectedPropertyId) || properties[0] || null,
    [properties, selectedPropertyId]
  );

  const projectData = useMemo(() => {
    if (!selectedProperty) return null;

    const propCosts = costEntries.filter(c => c.propertyId === selectedProperty.id);
    const propMaintenance = maintenanceTasks.filter(t => t.propertyId === selectedProperty.id);
    const propPredictions = predictions.filter(p => p.propertyId === selectedProperty.id || !p.propertyId);
    const propCompliance = compliance.filter(c => c.propertyId === selectedProperty.id || !c.propertyId);
    const propAssets = assets.filter(a => a.propertyId === selectedProperty.id || !a.propertyId);

    const capex = (selectedProperty.initialConstructionCost || 0) + (selectedProperty.materialCost || 0) + (selectedProperty.labourCost || 0);
    const opex = (selectedProperty.maintenanceCost || 0) + (selectedProperty.utilityCost || 0) + (selectedProperty.repairCost || 0);
    const tco = capex + opex + (selectedProperty.renovationCost || 0) + (selectedProperty.otherCost || 0);

    const materialBreakdown = [
      { name: "Construction", value: selectedProperty.initialConstructionCost || 0 },
      { name: "Materials", value: selectedProperty.materialCost || 0 },
      { name: "Labour", value: selectedProperty.labourCost || 0 },
      { name: "Maintenance", value: selectedProperty.maintenanceCost || 0 },
      { name: "Utilities", value: selectedProperty.utilityCost || 0 },
      { name: "Repairs", value: selectedProperty.repairCost || 0 },
    ].filter(d => d.value > 0);

    const costTrendData = propCosts.length > 0
      ? propCosts
          .filter(c => c.date)
          .map(c => ({
            month: new Date(c.date).toLocaleDateString("en-GB", { month: "short" }),
            amount: c.amount,
            phase: c.phase,
          }))
          .slice(-6)
      : [
          { month: "Jan", amount: capex * 0.3, phase: "Construction" },
          { month: "Feb", amount: capex * 0.2, phase: "Construction" },
          { month: "Mar", amount: opex * 0.15, phase: "Operational" },
          { month: "Apr", amount: opex * 0.2, phase: "Maintenance" },
          { month: "May", amount: opex * 0.1, phase: "Operational" },
          { month: "Jun", amount: opex * 0.15, phase: "Maintenance" },
        ];

    return {
      capex, opex, tco, materialBreakdown, costTrendData,
      propCosts, propMaintenance, propPredictions, propCompliance, propAssets,
      activePhase: determineActivePhase(selectedProperty),
    };
  }, [selectedProperty, costEntries, maintenanceTasks, predictions, compliance, assets]);

  const recentNotifications = useMemo(() => notifications.slice(0, 4), [notifications]);
  const topPredictions = useMemo(() => predictions.slice(0, 3), [predictions]);

  const handleOwnerTabChange = (tab: OwnerTab) => {
    setOwnerTab(tab);
    if (tab === "explorer" && !selectedPropertyId && properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
  };

  const handlePropertySelect = (propId: string) => {
    setSelectedPropertyId(propId);
    setProjectSelectorOpen(false);
    triggerToast("Switched to project view.", "info");
  };

  const handleDownloadReport = () => {
    setActiveTab("reports");
  };

  const chartTooltipStyle = {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    fontSize: "11px",
    color: "#f1f5f9",
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Executive Dashboard</span>
            </div>
            <h1 className="text-2xl font-black font-display tracking-tight">
              {ownerTab === "portfolio" ? "Portfolio Overview" : "Project Explorer"}
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-light">
              Welcome back, {currentUser?.name || "Owner"}. Financial oversight across {portfolio.propertyCount} properties.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadReport}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              View Reports
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab Switcher + Project Selector */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => handleOwnerTabChange("portfolio")}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              ownerTab === "portfolio"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Portfolio Overview
          </button>
          <button
            onClick={() => handleOwnerTabChange("explorer")}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              ownerTab === "explorer"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Project Explorer
          </button>
        </div>

        {ownerTab === "explorer" && properties.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setProjectSelectorOpen(!projectSelectorOpen)}
              className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white cursor-pointer hover:border-emerald-500/40 transition-all min-w-[240px] justify-between"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <div className="text-left">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">Selected Project</p>
                  <p className="text-xs">{selectedProperty?.name || "Select project"}</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${projectSelectorOpen ? "rotate-180" : ""}`} />
            </button>
            {projectSelectorOpen && (
              <div className="absolute right-0 top-full mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                {properties.map(prop => (
                  <button
                    key={prop.id}
                    onClick={() => handlePropertySelect(prop.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/50 last:border-0 ${
                      selectedPropertyId === prop.id ? "bg-emerald-50 dark:bg-emerald-950/20" : ""
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{prop.name}</p>
                      <p className="text-[10px] text-slate-400">{prop.location}</p>
                    </div>
                    {selectedPropertyId === prop.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {ownerTab === "portfolio" ? (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Bento Grid KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div variants={fadeInUp} whileHover={cardHover} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">TCO</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Cost of Ownership</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-display">
                  <CountUp end={portfolio.totalTco} prefix="KSh " duration={1200} />
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Across {portfolio.propertyCount} properties</p>
              </motion.div>

              <motion.div variants={fadeInUp} whileHover={cardHover} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full">CAPEX</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Capital Expenditure</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-display">
                  <CountUp end={portfolio.totalCapex} prefix="KSh " duration={1200} />
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Construction & materials</p>
              </motion.div>

              <motion.div variants={fadeInUp} whileHover={cardHover} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">OPEX</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Operating Expenditure</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-display">
                  <CountUp end={portfolio.totalOpex} prefix="KSh " duration={1200} />
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Utilities, maintenance, repairs</p>
              </motion.div>

              <motion.div variants={fadeInUp} whileHover={cardHover} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded-full">AI Score</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">AI Health Confidence</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-display">
                  <CountUp end={portfolio.avgAiConfidence} suffix="%" duration={1200} />
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Prediction engine confidence</p>
              </motion.div>
            </div>

            {/* Secondary KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Building Value", value: portfolio.totalBuildingValue, icon: Building2, color: "text-emerald-500", format: true },
                { label: "Active Projects", value: portfolio.activeProjects, icon: Activity, color: "text-blue-500", format: false },
                { label: "Sustainability", value: portfolio.avgSustainability, icon: Leaf, color: "text-green-500", format: false, suffix: "%" },
                { label: "Asset Condition", value: portfolio.avgAssetCondition, icon: ShieldCheck, color: "text-teal-500", format: false, suffix: "%" },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <motion.div
                    key={kpi.label}
                    variants={fadeInUp}
                    whileHover={cardHover}
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <Icon className={"w-4 h-4 " + kpi.color + " mb-2"} />
                    <p className="text-lg font-black text-slate-900 dark:text-white font-display">
                      {kpi.format ? <CountUp end={kpi.value} prefix="KSh " duration={1000} /> : <CountUp end={kpi.value} suffix={kpi.suffix || ""} duration={1000} />}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">{kpi.label}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Building Lifecycle Timeline */}
            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Building Lifecycle Progress</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Portfolio-wide lifecycle phase distribution</p>
                </div>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {lifecyclePhases.map((phase, i) => {
                  const activeCount = properties.filter(p => determineActivePhase(p) === i).length;
                  const isHighlighted = activeCount > 0;
                  return (
                    <React.Fragment key={phase.name}>
                      <div
                        className={`flex flex-col items-center min-w-[100px] ${phase.color} ${isHighlighted ? "opacity-100" : "opacity-40"} rounded-xl p-3 transition-all`}
                      >
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">{phase.name}</span>
                        <span className="text-lg font-black text-white font-display mt-1">{activeCount}</span>
                        <span className="text-[8px] text-white/80">{activeCount === 1 ? "building" : "buildings"}</span>
                      </div>
                      {i < lifecyclePhases.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-700 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </motion.div>

            {/* Financial Trends Chart */}
            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Financial Trends</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Cost trend analysis across portfolio</p>
                </div>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={[
                  { month: "Jan", capex: portfolio.totalCapex * 0.3, opex: portfolio.totalOpex * 0.2 },
                  { month: "Feb", capex: portfolio.totalCapex * 0.5, opex: portfolio.totalOpex * 0.25 },
                  { month: "Mar", capex: portfolio.totalCapex * 0.7, opex: portfolio.totalOpex * 0.3 },
                  { month: "Apr", capex: portfolio.totalCapex * 0.85, opex: portfolio.totalOpex * 0.4 },
                  { month: "May", capex: portfolio.totalCapex * 0.95, opex: portfolio.totalOpex * 0.5 },
                  { month: "Jun", capex: portfolio.totalCapex, opex: portfolio.totalOpex * 0.6 },
                ]}>
                  <defs>
                    <linearGradient id="capexGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="opexGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatKSh(v)} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatKSh(v)} />
                  <Area type="monotone" dataKey="capex" stroke="#3b82f6" strokeWidth={2} fill="url(#capexGrad)" name="CAPEX" />
                  <Area type="monotone" dataKey="opex" stroke="#f59e0b" strokeWidth={2} fill="url(#opexGrad)" name="OPEX" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Owned Buildings Grid */}
            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Owned Buildings</h3>
                <button
                  onClick={() => handleOwnerTabChange("explorer")}
                  className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  Explore Projects <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((property, i) => {
                  const activePhase = determineActivePhase(property);
                  const propertyTco = (property.initialConstructionCost || 0) + (property.materialCost || 0) +
                    (property.labourCost || 0) + (property.maintenanceCost || 0) + (property.utilityCost || 0) +
                    (property.repairCost || 0) + (property.renovationCost || 0) + (property.otherCost || 0);
                  return (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      whileHover={cardHover}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-emerald-500/30 transition-all cursor-pointer"
                      onClick={() => { setSelectedPropertyId(property.id); setOwnerTab("explorer"); }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{property.name}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{property.location}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          property.status === "Active"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        }`}>
                          {property.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                          <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold">TCO</p>
                          <p className="text-[11px] font-black text-slate-900 dark:text-white">{formatKSh(propertyTco)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                          <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold">Phase</p>
                          <p className="text-[11px] font-black text-slate-900 dark:text-white">{lifecyclePhases[activePhase].name}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                          <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold">Grade</p>
                          <p className="text-[11px] font-black text-slate-900 dark:text-white">{property.healthGrade}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* AI Predictions + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">AI Executive Insights</h3>
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div className="space-y-3">
                  {topPredictions.map((pred) => (
                    <div key={pred.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">{pred.category}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          pred.riskLevel === "Critical" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" :
                          pred.riskLevel === "High" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" :
                          pred.riskLevel === "Medium" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" :
                          "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        }`}>{pred.riskLevel}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">{pred.prediction}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">{pred.recommendation}</p>
                    </div>
                  ))}
                  {topPredictions.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No AI predictions available.</p>
                  )}
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Critical Alerts & Notifications</h3>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="space-y-3">
                  {recentNotifications.map((notif) => (
                    <div key={notif.id} className={`border rounded-xl p-3 ${
                      notif.severity === "critical" ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20" :
                      notif.severity === "high" ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20" :
                      "border-slate-200 dark:border-slate-800"
                    }`}>
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{notif.title}</span>
                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{notif.message}</p>
                    </div>
                  ))}
                  {recentNotifications.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No notifications.</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Maintenance Status + Compliance + Critical Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Maintenance</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Pending</span>
                    <span className="text-lg font-black text-amber-500">{portfolio.pendingMaintenance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Completed</span>
                    <span className="text-lg font-black text-emerald-500">{portfolio.paidMaintenance}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Cost</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{formatKSh(portfolio.totalMaintenanceCost)}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Compliance</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Issues</span>
                    <span className="text-lg font-black text-rose-500">{portfolio.complianceIssues}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Compliant</span>
                    <span className="text-lg font-black text-emerald-500">{compliance.length - portfolio.complianceIssues}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Items</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{compliance.length}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Critical Alerts</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Unresolved</span>
                    <span className="text-lg font-black text-rose-500">{portfolio.criticalAlerts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Critical Assets</span>
                    <span className="text-lg font-black text-amber-500">{portfolio.criticalAssets}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Anomalies</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{anomalies.length}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="explorer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {!selectedProperty || !projectData ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 border border-slate-200 dark:border-slate-800 text-center">
                <Building2 className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider mb-2">
                  {properties.length === 0 ? "No Projects Assigned" : "Select a Project"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  {properties.length === 0
                    ? "You do not currently have any assigned projects. Projects assigned by your Administrator will appear here."
                    : "Choose a project from the dropdown selector above to view its detailed dashboard, including cost breakdowns, lifecycle progress, AI predictions, and maintenance history."}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleOwnerTabChange("portfolio")}
                    className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    View Portfolio Overview
                  </button>
                  {properties.length === 0 && (
                    <button
                      onClick={() => setActiveTab("notifications")}
                      className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      Contact Administrator
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Project Header */}
                <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{selectedProperty.type}</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white font-display">{selectedProperty.name}</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{selectedProperty.location} · Grade {selectedProperty.healthGrade}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                        selectedProperty.status === "Active"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                      }`}>{selectedProperty.status}</span>
                    </div>
                  </div>

                  {/* Project Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Construction Phase</span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{lifecyclePhases[projectData.activePhase].name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {lifecyclePhases.map((phase, i) => (
                        <React.Fragment key={phase.name}>
                          <div className={`flex-1 h-2 rounded-full ${i <= projectData.activePhase ? phase.color : "bg-slate-200 dark:bg-slate-800"}`} />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Project KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDollarSign className="w-4 h-4 text-blue-500" />
                      <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">CAPEX</span>
                    </div>
                    <p className="text-xl font-black text-slate-900 dark:text-white font-display">{formatKSh(projectData.capex)}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Construction & materials</p>
                  </motion.div>
                  <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDollarSign className="w-4 h-4 text-amber-500" />
                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">OPEX</span>
                    </div>
                    <p className="text-xl font-black text-slate-900 dark:text-white font-display">{formatKSh(projectData.opex)}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Utilities, maintenance, repairs</p>
                  </motion.div>
                  <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">TCO</span>
                    </div>
                    <p className="text-xl font-black text-slate-900 dark:text-white font-display">{formatKSh(projectData.tco)}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Total cost of ownership</p>
                  </motion.div>
                </div>

                {/* Material Cost Breakdown + Cost Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Material Cost Breakdown</h3>
                      <Layers className="w-4 h-4 text-slate-400" />
                    </div>
                    {projectData.materialBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={projectData.materialBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {projectData.materialBreakdown.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatKSh(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-12">No cost breakdown data available.</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {projectData.materialBreakdown.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{d.name}</span>
                          <span className="text-[10px] text-slate-400 ml-auto font-mono">{formatKSh(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Cost Trends</h3>
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={projectData.costTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatKSh(v)} />
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatKSh(v)} />
                        <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} name="Cost" />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>

                {/* Lifecycle Timeline */}
                <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Lifecycle Timeline</h3>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {lifecyclePhases.map((phase, i) => {
                      const isCurrent = i === projectData.activePhase;
                      const isPast = i < projectData.activePhase;
                      return (
                        <React.Fragment key={phase.name}>
                          <div
                            className={`flex flex-col items-center min-w-[100px] rounded-xl p-3 transition-all ${
                              isCurrent ? `${phase.color} opacity-100 ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900` :
                              isPast ? `${phase.color} opacity-70` :
                              "bg-slate-100 dark:bg-slate-800 opacity-50"
                            }`}
                          >
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isCurrent || isPast ? "text-white" : "text-slate-400"}`}>{phase.name}</span>
                            {isCurrent && <span className="text-[8px] text-white/90 mt-1">Current</span>}
                            {isPast && <CheckCircle2 className="w-3 h-3 text-white/80 mt-1" />}
                          </div>
                          {i < lifecyclePhases.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-700 shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </motion.div>

                {/* AI Predictions + Maintenance History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">AI Cost Predictions</h3>
                      <Cpu className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="space-y-3">
                      {projectData.propPredictions.map((pred) => (
                        <div key={pred.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">{pred.category}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              pred.riskLevel === "Critical" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" :
                              pred.riskLevel === "High" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" :
                              "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                            }`}>{pred.riskLevel}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">{pred.prediction}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">{pred.recommendation}</p>
                        </div>
                      ))}
                      {projectData.propPredictions.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No predictions for this project.</p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Maintenance History</h3>
                      <Wrench className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="space-y-2">
                      {projectData.propMaintenance.slice(0, 6).map((task) => (
                        <div key={task.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-lg p-2.5">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{task.component}</p>
                            <p className="text-[10px] text-slate-400">{task.contractor} · {task.targetDate}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white">{formatKSh(task.amount)}</p>
                            <span className={`text-[8px] font-bold uppercase ${
                              task.status === "Paid" || task.status === "Completed" ? "text-emerald-500" :
                              task.status === "Overdue" ? "text-rose-500" : "text-amber-500"
                            }`}>{task.status}</span>
                          </div>
                        </div>
                      ))}
                      {projectData.propMaintenance.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No maintenance records for this project.</p>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Inspection History + Asset Condition */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Inspection & Compliance</h3>
                      <ClipboardList className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="space-y-2">
                      {projectData.propCompliance.slice(0, 6).map((item) => (
                        <div key={item.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-lg p-2.5">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.regulation}</p>
                            <p className="text-[10px] text-slate-400">{item.authority}</p>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            item.status === "Compliant" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" :
                            "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                          }`}>{item.status}</span>
                        </div>
                      ))}
                      {projectData.propCompliance.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No compliance records for this project.</p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Asset Condition</h3>
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="space-y-2">
                      {projectData.propAssets.slice(0, 6).map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-lg p-2.5">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{asset.name}</p>
                            <p className="text-[10px] text-slate-400">{asset.category}</p>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            asset.currentCondition === "New" || asset.currentCondition === "Good"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : asset.currentCondition === "Fair"
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                          }`}>{asset.currentCondition}</span>
                        </div>
                      ))}
                      {projectData.propAssets.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No assets registered for this project.</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Read-only notice */}
      <motion.div variants={fadeInUp} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          This dashboard is read-only. For maintenance updates, pricing configuration, or user management, contact your Administrator or Facility Manager.
        </p>
      </motion.div>
    </motion.div>
  );
}
