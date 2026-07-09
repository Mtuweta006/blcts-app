import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Crown, TrendingUp, TrendingDown, Wallet, Building2, Sparkles, Leaf, Activity, TriangleAlert as AlertTriangle, ArrowRight, FileText, ShieldCheck, Cpu, Clock, CircleCheck as CheckCircle2, Wrench, ChartBar as BarChart3 } from "lucide-react";
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
    const paidMaintenance = maintenanceTasks.filter(t => t.status === "Paid").length;
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

  const ownedProperties = useMemo(() => properties.slice(0, 4), [properties]);

  const recentNotifications = useMemo(() =>
    notifications.slice(0, 4)
  , [notifications]);

  const topPredictions = useMemo(() =>
    predictions.slice(0, 3)
  , [predictions]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Executive Dashboard</span>
            </div>
            <h1 className="text-2xl font-black font-display tracking-tight">Portfolio Overview</h1>
            <p className="text-sm text-slate-400 mt-1 font-light">
              Welcome back, {currentUser?.name || "Owner"}. Financial oversight across {portfolio.propertyCount} properties.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("reports")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Download Reports
            </button>
            <button
              onClick={() => setActiveTab("ai-predictions")}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Insights
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={fadeInUp} whileHover={cardHover} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer">
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

        <motion.div variants={fadeInUp} whileHover={cardHover} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer">
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

        <motion.div variants={fadeInUp} whileHover={cardHover} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer">
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

        <motion.div variants={fadeInUp} whileHover={cardHover} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer">
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
          { label: "Building Value", value: portfolio.totalBuildingValue, icon: Building2, color: "emerald", format: true },
          { label: "Active Projects", value: portfolio.activeProjects, icon: Activity, color: "blue", format: false },
          { label: "Sustainability", value: portfolio.avgSustainability, icon: Leaf, color: "green", format: false, suffix: "%" },
          { label: "Asset Condition", value: portfolio.avgAssetCondition, icon: ShieldCheck, color: "teal", format: false, suffix: "%" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              variants={fadeInUp}
              whileHover={cardHover}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <Icon className={`w-4 h-4 text-${kpi.color}-500 mb-2`} />
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className={`flex flex-col items-center min-w-[100px] ${phase.color} ${isHighlighted ? "opacity-100" : "opacity-40"} rounded-xl p-3 cursor-pointer transition-all hover:scale-105`}
                >
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">{phase.name}</span>
                  <span className="text-lg font-black text-white font-display mt-1">{activeCount}</span>
                  <span className="text-[8px] text-white/80">{activeCount === 1 ? "building" : "buildings"}</span>
                </motion.div>
                {i < lifecyclePhases.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-700 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* Owned Buildings Grid */}
      <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Owned Buildings</h3>
          <button
            onClick={() => setActiveTab("properties-mgmt")}
            className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ownedProperties.map((property, i) => {
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
            <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">AI Cost Predictions</h3>
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div className="space-y-3">
            {topPredictions.map((pred, i) => (
              <motion.div
                key={pred.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-3"
              >
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
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">Critical Alerts & Notifications</h3>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-3">
            {recentNotifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`border rounded-xl p-3 ${
                  notif.severity === "critical" ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20" :
                  notif.severity === "high" ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20" :
                  "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{notif.title}</span>
                  {!notif.isRead && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 mt-1" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{notif.message}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Maintenance Status + Compliance */}
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
