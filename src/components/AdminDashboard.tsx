import React, { useMemo } from "react";
import { Users, Building2, Wrench, DollarSign, TrendingUp, TriangleAlert as AlertTriangle, Activity, ShieldCheck, Cpu, FileText, MapPin, Clock } from "lucide-react";
import { motion } from "motion/react";
import { Property, CostEntry, MaintenanceTask, Vendor, Asset, ComplianceItem, AIPrediction, Anomaly, AppNotification, SystemSettings, User, ActiveTabType } from "../types";
import { getAllCounties, compareCountyPrices } from "../utils/pricingEngine";
import { staggerContainer, fadeInUp, cardHover } from "../utils/animations";
import CountUp from "./CountUp";
import { WorkflowStepper } from "./WorkflowComponents";

interface AdminDashboardProps {
  properties: Property[];
  costEntries: CostEntry[];
  maintenanceTasks: MaintenanceTask[];
  vendors: Vendor[];
  assets: Asset[];
  compliance: ComplianceItem[];
  predictions: AIPrediction[];
  anomalies: Anomaly[];
  notifications: AppNotification[];
  systemSettings: SystemSettings;
  setActiveTab: (tab: ActiveTabType) => void;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
  currentUser: User | null;
}

export default function AdminDashboard({
  properties, costEntries, maintenanceTasks, vendors, assets, compliance,
  predictions, anomalies, notifications, systemSettings, setActiveTab, triggerToast, currentUser
}: AdminDashboardProps) {

  const activeProperties = useMemo(() => properties.filter(p => !p.isSoftDeleted), [properties]);

  const kpis = useMemo(() => {
    const totalUsers = (() => {
      try { return JSON.parse(localStorage.getItem("blcts-users") || "[]").length; } catch { return 0; }
    })();
    const activeProjects = activeProperties.length;
    const buildingsRegistered = activeProperties.length;
    const pendingMaintenance = maintenanceTasks.filter(t => t.status === "Assigned" || t.status === "In-Progress").length;
    const totalConstructionCost = activeProperties.reduce((sum, p) => sum + (p.initialConstructionCost || p.capexBudget || 0), 0);
    const totalLifecycleCost = activeProperties.reduce((sum, p) => {
      return sum + (p.initialConstructionCost || 0) + (p.materialCost || 0) + (p.labourCost || 0) +
        (p.maintenanceCost || 0) + (p.utilityCost || 0) + (p.repairCost || 0) + (p.renovationCost || 0) + (p.otherCost || 0);
    }, 0);
    const criticalAlerts = anomalies.filter(a => a.severity === "Critical" && !a.isResolved).length;
    const complianceIssues = compliance.filter(c => c.status === "Non-Compliant" || c.status === "Pending Review").length;
    const unreadNotifs = notifications.filter(n => !n.isRead).length;

    return {
      totalUsers, activeProjects, buildingsRegistered, pendingMaintenance,
      totalConstructionCost, totalLifecycleCost, criticalAlerts, complianceIssues, unreadNotifs
    };
  }, [activeProperties, maintenanceTasks, anomalies, compliance, notifications]);

  const countyComparison = useMemo(() => {
    return compareCountyPrices("cement", "material").slice(0, 6);
  }, []);

  const recentLogs = systemSettings.auditLogs.slice(0, 5);

  const formatKSh = (val: number) => `KSh ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Administrator Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Platform-wide control center. Full visibility across all projects, users, and system health.
          </p>
          <div className="mt-3">
            <WorkflowStepper
              steps={[
                { label: "Create Users", status: "completed" },
                { label: "Register Buildings", status: "completed" },
                { label: "Assign Managers", status: "completed" },
                { label: "Configure Pricing", status: "active" },
                { label: "Configure AI", status: "pending" },
                { label: "Monitor System", status: "pending" },
                { label: "Audit Logs", status: "pending" },
                { label: "Reports", status: "pending" },
              ]}
            />
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Logged in as</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser?.name} ({currentUser?.role})</span>
        </div>
      </div>

      {/* KPI Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <KpiCard icon={Users} label="Total Users" value={kpis.totalUsers} color="text-indigo-400" />
        <KpiCard icon={Building2} label="Active Projects" value={kpis.activeProjects} color="text-emerald-400" />
        <KpiCard icon={Building2} label="Buildings Registered" value={kpis.buildingsRegistered} color="text-sky-400" />
        <KpiCard icon={Wrench} label="Pending Maintenance" value={kpis.pendingMaintenance} color="text-orange-400" />
        <KpiCard icon={DollarSign} label="Total Construction Cost" value={kpis.totalConstructionCost} color="text-teal-400" prefix="KSh " />
        <KpiCard icon={TrendingUp} label="Total Lifecycle Cost" value={kpis.totalLifecycleCost} color="text-cyan-400" prefix="KSh " />
        <KpiCard icon={AlertTriangle} label="Critical Alerts" value={kpis.criticalAlerts} color="text-rose-400" />
        <KpiCard icon={ShieldCheck} label="Compliance Issues" value={kpis.complianceIssues} color="text-amber-400" />
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Cost Comparison */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            Regional Cost Comparison (Cement 50kg)
          </h3>
          <div className="space-y-2">
            {countyComparison.map((c, i) => (
              <div key={c.county} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${i === 0 ? "bg-emerald-500" : i === countyComparison.length - 1 ? "bg-rose-500" : "bg-slate-400"}`} />
                  {c.county}
                </span>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatKSh(c.finalPrice)}</span>
                  <span className="text-[10px] text-slate-400 block">Base: {formatKSh(c.basePrice)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-400 italic flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            Safety margin of KSh {systemSettings.safetyMargin} applied to all base prices
          </div>
        </div>

        {/* AI Predictions Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            AI Predictions Overview
          </h3>
          <div className="space-y-2">
            {predictions.slice(0, 4).map(pred => (
              <div key={pred.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{pred.category}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    pred.riskLevel === "Critical" ? "bg-rose-950 text-rose-400" :
                    pred.riskLevel === "High" ? "bg-orange-950 text-orange-400" :
                    pred.riskLevel === "Medium" ? "bg-amber-950 text-amber-400" :
                    "bg-emerald-950 text-emerald-400"
                  }`}>{pred.riskLevel}</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal font-light">{pred.prediction}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveTab("ai-predictions")}
            className="w-full text-[10px] uppercase tracking-wider font-bold text-emerald-500 hover:text-emerald-400 py-2 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            View All Predictions
          </button>
        </div>

        {/* Maintenance Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-400" />
            Maintenance Alerts
          </h3>
          <div className="space-y-2">
            {maintenanceTasks.filter(t => t.status === "Assigned" || t.status === "In-Progress").slice(0, 4).map(task => {
              const prop = activeProperties.find(p => p.id === task.propertyId);
              return (
                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">{task.component}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{prop?.name || "Unknown"}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ml-2 ${
                    task.status === "Assigned" ? "bg-sky-950 text-sky-400" : "bg-amber-950 text-amber-400"
                  }`}>{task.status}</span>
                </div>
              );
            })}
            {maintenanceTasks.filter(t => t.status === "Assigned" || t.status === "In-Progress").length === 0 && (
              <div className="text-center py-6 text-[10px] text-slate-400">No pending maintenance tasks</div>
            )}
          </div>
        </div>

        {/* Recent Activity / Audit Logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg">
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {log.userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">{log.action}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{log.details}</span>
                  <span className="text-[9px] text-slate-400 font-mono block">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickActionBtn icon={Users} label="Manage Users" onClick={() => setActiveTab("user-management")} />
          <QuickActionBtn icon={FileText} label="System Settings" onClick={() => setActiveTab("system-settings")} />
          <QuickActionBtn icon={Building2} label="View Projects" onClick={() => setActiveTab("properties-mgmt")} />
          <QuickActionBtn icon={Cpu} label="Cost Estimation" onClick={() => setActiveTab("cost-estimation")} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, prefix }: { icon: any; label: string; value: number; color: string; prefix?: string }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={cardHover}
      className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 space-y-2 cursor-default"
    >
      <div className="flex items-center justify-between">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">{label}</span>
        <span className="text-sm font-black text-slate-900 dark:text-white font-mono block mt-1 break-all">
          <CountUp end={value} prefix={prefix || ""} duration={800} />
        </span>
      </div>
    </motion.div>
  );
}

function QuickActionBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
    >
      <Icon className="w-4 h-4 text-emerald-500" />
      <span>{label}</span>
    </button>
  );
}
