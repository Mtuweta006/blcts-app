import React, { useMemo } from "react";
import { Wrench, Building2, DollarSign, TriangleAlert as AlertTriangle, ShieldCheck, Sparkles, Bell, Activity, Leaf, Cpu, MapPin } from "lucide-react";
import { Property, MaintenanceTask, Asset, ComplianceItem, SustainabilityMetric, AIPrediction, Anomaly, AppNotification, User, ActiveTabType } from "../types";

interface FacilityDashboardProps {
  selectedProperty: Property;
  selectedPropertyId: string;
  calculations: { capex: number; opex: number; tco: number; lifecycleTco: number; entryCount: number };
  maintenanceTasks: MaintenanceTask[];
  assets: Asset[];
  compliance: ComplianceItem[];
  sustainability: SustainabilityMetric[];
  predictions: AIPrediction[];
  notifications: AppNotification[];
  anomalies: Anomaly[];
  setActiveTab: (tab: ActiveTabType) => void;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
  currentUser: User | null;
}

export default function FacilityDashboard({
  selectedProperty, selectedPropertyId, calculations, maintenanceTasks, assets,
  compliance, sustainability, predictions, notifications, anomalies, setActiveTab, triggerToast, currentUser
}: FacilityDashboardProps) {

  const propertyMaintenance = useMemo(() => maintenanceTasks.filter(t => t.propertyId === selectedPropertyId), [maintenanceTasks, selectedPropertyId]);
  const propertyAssets = useMemo(() => assets.filter(a => a.propertyId === selectedPropertyId), [assets, selectedPropertyId]);
  const propertyCompliance = useMemo(() => compliance.filter(c => c.propertyId === selectedPropertyId), [compliance, selectedPropertyId]);
  const propertySustainability = useMemo(() => sustainability.filter(s => s.propertyId === selectedPropertyId), [sustainability, selectedPropertyId]);
  const propertyPredictions = useMemo(() => predictions.filter(p => p.propertyId === selectedPropertyId), [predictions, selectedPropertyId]);
  const propertyAnomalies = useMemo(() => anomalies.filter(a => a.propertyId === selectedPropertyId), [anomalies, selectedPropertyId]);
  const propertyNotifications = useMemo(() => notifications.filter(n => !n.propertyId || n.propertyId === selectedPropertyId), [notifications, selectedPropertyId]);

  const pendingTasks = propertyMaintenance.filter(t => t.status === "Scheduled" || t.status === "In-Progress");
  const overdueTasks = propertyMaintenance.filter(t => t.status === "Overdue");
  const criticalAssets = propertyAssets.filter(a => a.currentCondition === "Poor" || a.currentCondition === "Critical");
  const complianceIssues = propertyCompliance.filter(c => c.status === "Non-Compliant" || c.status === "Pending Review");
  const latestSustainability = propertySustainability[propertySustainability.length - 1];

  const formatKSh = (val: number) => `KSh ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            Facility Manager Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Building-level operations for {selectedProperty.name}. Focus on maintenance, utilities, and compliance.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Assigned Building</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-500" />
            {selectedProperty.county || "Nairobi"} - {selectedProperty.city || selectedProperty.location}
          </span>
        </div>
      </div>

      {/* Building KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Wrench} label="Pending Tasks" value={String(pendingTasks.length)} color="text-orange-400" />
        <KpiCard icon={AlertTriangle} label="Overdue" value={String(overdueTasks.length)} color="text-rose-400" />
        <KpiCard icon={ShieldCheck} label="Compliance Issues" value={String(complianceIssues.length)} color="text-amber-400" />
        <KpiCard icon={DollarSign} label="Building TCO" value={formatKSh(calculations.lifecycleTco || calculations.tco)} color="text-emerald-400" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Task Queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-400" />
              Maintenance Task Queue
            </h3>
            <button
              onClick={() => setActiveTab("maintenance")}
              className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {pendingTasks.length > 0 ? pendingTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">{task.component}</span>
                  <span className="text-[10px] text-slate-400 block">{task.contractor} - Due: {task.targetDate}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ml-2 ${
                  task.status === "Scheduled" ? "bg-sky-950 text-sky-400" : "bg-amber-950 text-amber-400"
                }`}>{task.status}</span>
              </div>
            )) : (
              <div className="text-center py-6">
                <Wrench className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400">No pending maintenance tasks. All clear!</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            AI Recommendations
          </h3>
          <div className="space-y-2">
            {propertyPredictions.slice(0, 4).map(pred => (
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
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal font-light mb-1">{pred.prediction}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{pred.recommendation}</p>
              </div>
            ))}
            {propertyPredictions.length === 0 && (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400">No AI predictions for this building yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Asset Condition Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Asset Condition Summary
            </h3>
            <button
              onClick={() => setActiveTab("assets")}
              className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {propertyAssets.slice(0, 5).map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">{asset.name}</span>
                  <span className="text-[10px] text-slate-400 block">{asset.category}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ml-2 ${
                  asset.currentCondition === "New" ? "bg-emerald-950 text-emerald-400" :
                  asset.currentCondition === "Good" ? "bg-sky-950 text-sky-400" :
                  asset.currentCondition === "Fair" ? "bg-amber-950 text-amber-400" :
                  asset.currentCondition === "Poor" ? "bg-orange-950 text-orange-400" :
                  "bg-rose-950 text-rose-400"
                }`}>{asset.currentCondition}</span>
              </div>
            ))}
            {propertyAssets.length === 0 && (
              <div className="text-center py-6 text-[10px] text-slate-400">No assets registered for this building.</div>
            )}
          </div>
          {criticalAssets.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {criticalAssets.length} asset(s) need urgent attention
              </span>
            </div>
          )}
        </div>

        {/* Compliance Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Compliance Status
            </h3>
            <button
              onClick={() => setActiveTab("compliance")}
              className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {propertyCompliance.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">{item.regulation}</span>
                  <span className="text-[10px] text-slate-400 block">Next: {item.nextInspectionDate}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ml-2 ${
                  item.status === "Compliant" ? "bg-emerald-950 text-emerald-400" :
                  item.status === "Pending Review" ? "bg-amber-950 text-amber-400" :
                  item.status === "Expired" ? "bg-orange-950 text-orange-400" :
                  "bg-rose-950 text-rose-400"
                }`}>{item.status}</span>
              </div>
            ))}
            {propertyCompliance.length === 0 && (
              <div className="text-center py-6 text-[10px] text-slate-400">No compliance items for this building.</div>
            )}
          </div>
        </div>
      </div>

      {/* Utility & Sustainability Summary */}
      {latestSustainability && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-400" />
            Utility & Sustainability ({latestSustainability.month})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Electricity</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block mt-1">{latestSustainability.electricityKwh.toLocaleString()} kWh</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Water</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block mt-1">{latestSustainability.waterLitres.toLocaleString()} L</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Carbon</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block mt-1">{latestSustainability.carbonEmissionsKg.toLocaleString()} kg</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Green Score</span>
              <span className="text-xs font-mono font-bold text-emerald-500 block mt-1">{latestSustainability.greenBuildingScore}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* Property-Specific Notifications */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-400" />
            Building Notifications
          </h3>
          <button
            onClick={() => setActiveTab("notifications")}
            className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer"
          >
            View All
          </button>
        </div>
        <div className="space-y-2">
          {propertyNotifications.slice(0, 4).map(notif => (
            <div key={notif.id} className={`p-3 rounded-xl border ${
              notif.severity === "critical" ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40" :
              notif.severity === "high" ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40" :
              notif.severity === "medium" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40" :
              "bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800"
            }`}>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{notif.title}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{notif.message}</span>
            </div>
          ))}
          {propertyNotifications.length === 0 && (
            <div className="text-center py-6 text-[10px] text-slate-400">No notifications for this building.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 space-y-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">{label}</span>
        <span className="text-sm font-black text-slate-900 dark:text-white font-mono block mt-1 break-all">{value}</span>
      </div>
    </div>
  );
}
