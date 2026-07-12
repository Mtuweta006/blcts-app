import React, { useMemo, useState, useEffect } from "react";
import { Users, Building2, Wrench, DollarSign, TrendingUp, TriangleAlert as AlertTriangle, Activity, ShieldCheck, Cpu, FileText, MapPin, Clock, Pencil, Check, X as XIcon, RefreshCw, Package, HardHat } from "lucide-react";
import { motion } from "motion/react";
import { Property, CostEntry, MaintenanceTask, Vendor, Asset, ComplianceItem, AIPrediction, Anomaly, AppNotification, SystemSettings, User, ActiveTabType } from "../types";
import { getAllCounties, compareCountyPrices } from "../utils/pricingEngine";
import { staggerContainer, fadeInUp, cardHover } from "../utils/animations";
import CountUp from "./CountUp";
import { WorkflowStepper } from "./WorkflowComponents";
import { fetchConstructionMaterials, updateMaterialPrice, invalidatePricingCache, ConstructionMaterialRow } from "../lib/supabase";

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

  // Material/Labour price editor state
  const [priceRows, setPriceRows] = useState<ConstructionMaterialRow[]>([]);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceFilter, setPriceFilter] = useState<"material" | "labour" | "service">("material");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("");
  const [priceSaving, setPriceSaving] = useState(false);
  const [adminTab, setAdminTab] = useState<"overview" | "pricing">("overview");

  useEffect(() => {
    fetchConstructionMaterials().then(rows => {
      setPriceRows(rows);
      setPriceLoading(false);
    }).catch(() => setPriceLoading(false));
  }, []);

  async function handleSavePrice(id: string) {
    const val = parseFloat(editingPriceValue);
    if (isNaN(val) || val <= 0) {
      triggerToast("Enter a valid positive price.", "warning");
      return;
    }
    setPriceSaving(true);
    const ok = await updateMaterialPrice(id, val);
    if (ok) {
      invalidatePricingCache();
      setPriceRows(prev => prev.map(r => r.id === id ? { ...r, unit_price: val } : r));
      triggerToast("Price updated. Future estimates will use the new rate.", "success");
    } else {
      triggerToast("Failed to save price. Check your connection.", "warning");
    }
    setEditingPriceId(null);
    setPriceSaving(false);
  }

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
                { label: "Configure Pricing", status: adminTab === "pricing" ? "active" : "completed" },
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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {(["overview", "pricing"] as const).map(t => (
          <button key={t} onClick={() => setAdminTab(t)}
            className={`py-2 px-4 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              adminTab === t
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}>
            {t === "overview" ? "System Overview" : "Material & Labour Prices"}
          </button>
        ))}
      </div>

      {adminTab === "overview" && (
        <>
          {/* KPI Grid */}
          <motion.div variants={staggerContainer} initial="hidden" animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="Total Users" value={kpis.totalUsers} color="text-indigo-400" />
            <KpiCard icon={Building2} label="Active Projects" value={kpis.activeProjects} color="text-emerald-400" />
            <KpiCard icon={Building2} label="Buildings Registered" value={kpis.buildingsRegistered} color="text-sky-400" />
            <KpiCard icon={Wrench} label="Pending Maintenance" value={kpis.pendingMaintenance} color="text-orange-400" />
            <KpiCard icon={DollarSign} label="Total Construction Cost" value={kpis.totalConstructionCost} color="text-teal-400" prefix="KSh " />
            <KpiCard icon={TrendingUp} label="Total Lifecycle Cost" value={kpis.totalLifecycleCost} color="text-cyan-400" prefix="KSh " />
            <KpiCard icon={AlertTriangle} label="Critical Alerts" value={kpis.criticalAlerts} color="text-rose-400" />
            <KpiCard icon={ShieldCheck} label="Compliance Issues" value={kpis.complianceIssues} color="text-amber-400" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional Cost Comparison */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />Regional Cost Comparison (Cement 50kg)
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
            </div>

            {/* AI Predictions Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />AI Predictions Overview
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
              <button onClick={() => setActiveTab("ai-predictions")}
                className="w-full text-[10px] uppercase tracking-wider font-bold text-emerald-500 hover:text-emerald-400 py-2 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer">
                View All Predictions
              </button>
            </div>

            {/* Maintenance Alerts */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-400" />Maintenance Alerts
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

            {/* Audit Logs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />Recent Activity
              </h3>
              <div className="space-y-2">
                {recentLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {log.userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
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
              <QuickActionBtn icon={Package} label="Manage Prices" onClick={() => setAdminTab("pricing")} />
            </div>
          </div>
        </>
      )}

      {adminTab === "pricing" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-500" />
                  Material &amp; Labour Price Database
                </h3>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  All prices stored in Supabase. Changes take effect on the next estimate calculation.
                </p>
              </div>
              <button
                onClick={() => {
                  setPriceLoading(true);
                  invalidatePricingCache();
                  fetchConstructionMaterials().then(rows => { setPriceRows(rows); setPriceLoading(false); });
                }}
                disabled={priceLoading}
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3 h-3 ${priceLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
            {/* Category filter tabs */}
            <div className="flex gap-2 mt-4">
              {(["material", "labour", "service"] as const).map(cat => (
                <button key={cat} onClick={() => setPriceFilter(cat)}
                  className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                    priceFilter === cat
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}>
                  {cat === "material" ? <><Package className="w-3 h-3 inline mr-1" />Materials</>
                    : cat === "labour" ? <><HardHat className="w-3 h-3 inline mr-1" />Labour</>
                    : <><Activity className="w-3 h-3 inline mr-1" />Services</>}
                  <span className="ml-1.5 bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded-full text-[8px]">
                    {priceRows.filter(r => r.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {priceLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 text-slate-300 mx-auto animate-spin mb-2" />
              <p className="text-xs text-slate-400">Loading prices from database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Item</th>
                    <th className="text-left px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                    <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Unit Price (KSh)</th>
                    <th className="text-left px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                    <th className="text-center px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {priceRows.filter(r => r.category === priceFilter).map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{row.name}</div>
                        <div className="text-[9px] font-mono text-slate-400">{row.item_id}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.unit}</td>
                      <td className="px-4 py-3 text-right">
                        {editingPriceId === row.id ? (
                          <input
                            type="number"
                            value={editingPriceValue}
                            onChange={e => setEditingPriceValue(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleSavePrice(row.id); if (e.key === "Escape") setEditingPriceId(null); }}
                            autoFocus
                            className="w-28 text-right bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        ) : (
                          <span className="text-xs font-bold font-mono text-slate-800 dark:text-white">{row.unit_price.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[9px] text-slate-400 max-w-xs truncate">{row.notes || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {editingPriceId === row.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSavePrice(row.id)}
                              disabled={priceSaving}
                              className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                              title="Save (Enter)"
                            >
                              {priceSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Cancel (Esc)"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingPriceId(row.id); setEditingPriceValue(String(row.unit_price)); }}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Edit price"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950/10 border-t border-blue-100 dark:border-blue-900/30">
            <p className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">
              Click the pencil icon to edit any price. Press Enter to save or Escape to cancel. All changes persist immediately to Supabase and affect future BOQ estimates.
            </p>
          </div>
        </div>
      )}
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
