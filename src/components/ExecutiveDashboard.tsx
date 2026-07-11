import React from "react";
import { Building2, Coins, TrendingUp, Sparkles, Lightbulb, Wrench, ShieldCheck, Leaf, Users, Gauge, Activity, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, ArrowUpRight, ArrowDownRight, Zap, Droplet, Cloud } from "lucide-react";
import { Property, AIInsight, ChartDataPoint, Vendor, Asset, ComplianceItem, SustainabilityMetric, AIPrediction, Anomaly } from "../types";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, RadialBarChart, RadialBar, Legend
} from "recharts";

interface ExecutiveDashboardProps {
  selectedProperty: Property;
  selectedPropertyId: string;
  calculations: { capex: number; opex: number; tco: number; entryCount: number };
  svgChartPaths?: any;
  activeInsights?: AIInsight[];
  filteredTasks?: any[];
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  phaseFilter?: string;
  setPhaseFilter?: (filter: string) => void;
  setActiveTab?: (tab: any) => void;
  triggerToast?: (msg: string, type?: "success" | "info" | "warning") => void;
  costTrends: ChartDataPoint[];
  propertiesList?: Property[];
  maintTasksList?: any[];
  onUpdateProperty?: (updated: Property) => void;
  vendors?: Vendor[];
  assets?: Asset[];
  compliance?: ComplianceItem[];
  sustainability?: SustainabilityMetric[];
  predictions?: AIPrediction[];
  anomalies?: Anomaly[];
}

export default function ExecutiveDashboard({
  selectedProperty,
  selectedPropertyId,
  calculations,
  costTrends,
  propertiesList = [],
  activeInsights = [],
  setActiveTab,
  vendors = [],
  assets = [],
  compliance = [],
  sustainability = [],
  predictions = [],
  anomalies = [],
  maintTasksList = []
}: ExecutiveDashboardProps) {

  const formatKSh = (value: any): string => {
    const n = Number(value);
    if (isNaN(n)) return "KSh 0";
    if (n >= 1_000_000_000) return `KSh ${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `KSh ${(n / 1_000).toFixed(0)}K`;
    return `KSh ${n.toLocaleString()}`;
  };

  const activeProjects = propertiesList.filter(p => !p.isSoftDeleted);
  const totalProperties = activeProjects.length;
  const activeProjectCount = activeProjects.filter(p => p.status === "Under Construction" || p.status === "Active").length;
  const annualCapex = activeProjects.reduce((s, p) => s + (p.capexBudget || 0), 0);
  const annualOpex = activeProjects.reduce((s, p) => s + (p.opexBudget || 0), 0);
  const maintenanceCost = calculations.opex;
  const lifecycleCost = calculations.tco;
  const budgetUtilization = Math.min(100, Math.round((calculations.capex / (selectedProperty.capexBudget || 1)) * 100));
  const activeContractors = new Set(vendors.filter(v => v.type === "Contractor").map(v => v.id)).size;
  const vendorPerformance = vendors.length > 0 ? (vendors.reduce((s, v) => s + v.performanceRating, 0) / vendors.length) : 0;
  const complianceScore = compliance.length > 0
    ? Math.round((compliance.filter(c => c.status === "Compliant").length / compliance.length) * 100)
    : 0;
  const propSustainability = sustainability.filter(s => s.propertyId === selectedPropertyId);
  const sustainabilityIndex = propSustainability.length > 0
    ? Math.round(propSustainability.reduce((s, m) => s + m.greenBuildingScore, 0) / propSustainability.length)
    : 0;
  const aiConfidence = predictions.length > 0
    ? Math.round(predictions.reduce((s, p) => s + p.confidenceScore, 0) / predictions.length)
    : 0;

  const trendChartData = costTrends.map(item => ({
    month: item.month,
    "CAPEX": item.capexActual,
    "OPEX": item.opexActual,
  }));

  const capexVsOpexData = costTrends.map(item => ({
    month: item.month,
    "CAPEX": item.capexActual,
    "OPEX": item.opexActual,
  }));

  const breakdownData = [
    { name: "Foundation", value: (selectedProperty.initialConstructionCost || 0) * 0.30, color: "#10b981" },
    { name: "Superstructure", value: (selectedProperty.initialConstructionCost || 0) * 0.28, color: "#3b82f6" },
    { name: "Roofing", value: (selectedProperty.initialConstructionCost || 0) * 0.15, color: "#f59e0b" },
    { name: "MEP Systems", value: (selectedProperty.initialConstructionCost || 0) * 0.17, color: "#ec4899" },
    { name: "Finishes", value: (selectedProperty.initialConstructionCost || 0) * 0.10, color: "#06b6d4" },
  ];

  const maintenanceFreqData = React.useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts: Record<string, number> = {};
    monthNames.forEach(m => counts[m] = 0);
    (maintTasksList || []).forEach(t => {
      const d = new Date(t.targetDate);
      if (!isNaN(d.getTime())) {
        const m = monthNames[d.getMonth()];
        if (m) counts[m]++;
      }
    });
    return monthNames.slice(0, 6).map(m => ({ month: m, count: counts[m] }));
  }, [maintTasksList]);

  const energyData = propSustainability.map(m => ({ month: m.month, kwh: m.electricityKwh, renewable: m.renewableEnergyKwh }));
  const waterData = propSustainability.map(m => ({ month: m.month, litres: m.waterLitres }));
  const carbonData = propSustainability.map(m => ({ month: m.month, emissions: m.carbonEmissionsKg }));

  const vendorPerfData = vendors.map(v => ({
    name: v.name.substring(0, 12),
    rating: v.performanceRating,
    onTime: v.deliveryOnTimeRate,
  }));

  const assetHealthData = assets.map(a => ({
    name: a.name.substring(0, 15),
    health: a.currentCondition === "New" ? 100 : a.currentCondition === "Good" ? 80 : a.currentCondition === "Fair" ? 55 : a.currentCondition === "Poor" ? 30 : 10,
  }));

  const forecastData = [...costTrends.map(t => ({ month: t.month, actual: t.opexActual, forecast: null as any })), ...[
    { month: "Jul", actual: null, forecast: Math.round(calculations.opex * 1.05) },
    { month: "Aug", actual: null, forecast: Math.round(calculations.opex * 1.08) },
    { month: "Sep", actual: null, forecast: Math.round(calculations.opex * 1.12) },
  ]];

  const kpiCards = [
    { label: "Total Properties", value: totalProperties.toString(), icon: Building2, color: "emerald", trend: null },
    { label: "Active Projects", value: activeProjectCount.toString(), icon: Activity, color: "blue", trend: null },
    { label: "Annual CAPEX", value: formatKSh(annualCapex), icon: Coins, color: "emerald", trend: null },
    { label: "Annual OPEX", value: formatKSh(annualOpex), icon: TrendingUp, color: "blue", trend: null },
    { label: "Maintenance Costs", value: formatKSh(maintenanceCost), icon: Wrench, color: "amber", trend: null },
    { label: "Lifecycle Cost", value: formatKSh(lifecycleCost), icon: Gauge, color: "slate", trend: null },
    { label: "Budget Utilization", value: `${budgetUtilization}%`, icon: Sparkles, color: "cyan", trend: null },
    { label: "Active Contractors", value: activeContractors.toString(), icon: Users, color: "indigo", trend: null },
    { label: "Vendor Performance", value: `${vendorPerformance.toFixed(1)}/5`, icon: CheckCircle2, color: "emerald", trend: null },
    { label: "Compliance Score", value: `${complianceScore}%`, icon: ShieldCheck, color: complianceScore >= 80 ? "emerald" : "amber", trend: null },
    { label: "Sustainability Index", value: `${sustainabilityIndex}/100`, icon: Leaf, color: "green", trend: null },
    { label: "AI Confidence Index", value: `${aiConfidence}%`, icon: Sparkles, color: "violet", trend: null },
  ];

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
    cyan: "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400",
    indigo: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400",
    green: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400",
    violet: "bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400",
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">

      {/* Project Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">Project Summary</h3>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider border border-emerald-500/20">
            {selectedProperty.status || "Active"}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
          <div className="space-y-1"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Project Name</span><span className="font-semibold text-slate-200 block truncate">{selectedProperty.name}</span></div>
          <div className="space-y-1"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Location</span><span className="font-semibold text-slate-200 block truncate">{selectedProperty.location}</span></div>
          <div className="space-y-1"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Building Type</span><span className="font-semibold text-slate-200 block">{selectedProperty.type || "Mixed-Use"}</span></div>
          <div className="space-y-1"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Floor Area</span><span className="font-mono font-semibold text-slate-200 block">{(selectedProperty.estimatedFloorArea || 0).toLocaleString()} SQM</span></div>
          <div className="space-y-1"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Floors</span><span className="font-mono font-semibold text-slate-200 block">{selectedProperty.floors || 0} Levels</span></div>
          <div className="space-y-1"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Health Grade</span><span className={`font-semibold block ${selectedProperty.healthGrade === "A" ? "text-emerald-400" : selectedProperty.healthGrade === "C" ? "text-amber-400" : "text-slate-200"}`}>{selectedProperty.healthGrade || "N/A"}</span></div>
          <div className="space-y-1"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lifespan</span><span className="font-mono font-semibold text-slate-200 block">{selectedProperty.expectedLifecycleYears || 0} Years</span></div>
        </div>
      </div>

      {/* 12 KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${colorMap[kpi.color]}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                {kpi.trend && (
                  <span className={`text-[9px] font-bold flex items-center gap-0.5 ${kpi.trend.startsWith("+") ? "text-rose-500" : "text-emerald-500"}`}>
                    {kpi.trend.startsWith("+") ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.trend}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{kpi.label}</span>
                <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white block font-mono mt-0.5">{kpi.value}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Charts Row 1: Monthly Cost Trends + CAPEX vs OPEX */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Monthly Cost Trends</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">CAPEX and OPEX distribution over 6 months</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="capexG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="opexG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => formatKSh(v)} />
                <Tooltip formatter={(v: any) => formatKSh(v)} contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="CAPEX" stroke="#10b981" strokeWidth={2} fill="url(#capexG)" />
                <Area type="monotone" dataKey="OPEX" stroke="#3b82f6" strokeWidth={2} fill="url(#opexG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">CAPEX vs OPEX</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Comparative bar analysis of capital vs operational expenditure</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capexVsOpexData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => formatKSh(v)} />
                <Tooltip formatter={(v: any) => formatKSh(v)} contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="CAPEX" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="OPEX" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Charts Row 2: Cost Distribution + Maintenance Frequency */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Cost Distribution</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Construction cost allocation by component</p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-64">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {breakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatKSh(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              {breakdownData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">{formatKSh(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Maintenance Frequency</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Monthly maintenance task count</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceFreqData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Charts Row 3: Energy + Water */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Energy Consumption</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Electricity usage vs renewable generation (kWh)</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="kwh" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Grid (kWh)" />
                <Bar dataKey="renewable" fill="#10b981" radius={[4, 4, 0, 0]} name="Renewable (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2"><Droplet className="w-4 h-4 text-blue-500" /> Water Usage</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Monthly water consumption (litres)</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={waterData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs><linearGradient id="waterG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="litres" stroke="#3b82f6" strokeWidth={2} fill="url(#waterG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Charts Row 4: Carbon + Vendor Performance */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2"><Cloud className="w-4 h-4 text-slate-500" /> Carbon Emissions</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Monthly CO2 emissions (kg)</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={carbonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="emissions" stroke="#64748b" strokeWidth={2} dot={{ r: 3 }} name="CO2 (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Vendor Performance</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Rating and on-time delivery rate by vendor</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorPerfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" width={80} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="onTime" fill="#10b981" radius={[0, 4, 4, 0]} name="On-Time %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Charts Row 5: Asset Health + Predictive Forecasts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2"><Gauge className="w-4 h-4 text-emerald-500" /> Asset Health</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Condition index by asset</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 8 }} stroke="#94a3b8" angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Bar dataKey="health" fill="#10b981" radius={[4, 4, 0, 0]} name="Health Index">
                  {assetHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.health >= 75 ? "#10b981" : entry.health >= 50 ? "#f59e0b" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Predictive Forecasts</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Actual vs AI-projected OPEX (next 3 months)</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => formatKSh(v)} />
                <Tooltip formatter={(v: any) => formatKSh(v)} contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Actual" connectNulls={false} />
                <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="AI Forecast" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* AI Insights + Anomalies */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" /> AI Insights
          </h3>
          <div className="space-y-3">
            {activeInsights.map((insight, i) => (
              <div key={i} className={`p-3 rounded-xl border ${insight.type === "alert" ? "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/10" : insight.type === "warning" ? "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/10" : "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/10"}`}>
                <div className="flex items-start gap-2">
                  {insight.type === "alert" ? <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> : insight.type === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> : <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{insight.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{insight.description}</p>
                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mt-1.5">{insight.financialImpact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Active Anomalies
          </h3>
          <div className="space-y-3">
            {anomalies.filter(a => !a.isResolved).slice(0, 4).map((anom) => (
              <div key={anom.id} className={`p-3 rounded-xl border ${anom.severity === "Critical" ? "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/10" : anom.severity === "High" ? "border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/10" : "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/10"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{anom.category}</span>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${anom.severity === "Critical" ? "bg-rose-500 text-white" : anom.severity === "High" ? "bg-orange-500 text-white" : "bg-amber-500 text-white"}`}>{anom.severity}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{anom.description}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 font-medium">→ {anom.recommendation}</p>
              </div>
            ))}
            {anomalies.filter(a => !a.isResolved).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No active anomalies detected</p>
            )}
          </div>
        </div>
      </section>

      {/* AI Predictions */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" /> AI Predictions
          </h3>
          {setActiveTab && (
            <button onClick={() => setActiveTab("ai-predictions")} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline uppercase tracking-wider">
              View All →
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.slice(0, 3).map((pred) => (
            <div key={pred.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{pred.category}</span>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${pred.riskLevel === "Critical" ? "bg-rose-500 text-white" : pred.riskLevel === "High" ? "bg-orange-500 text-white" : pred.riskLevel === "Medium" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"}`}>{pred.riskLevel}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{pred.prediction}</p>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Confidence: <strong className="text-slate-800 dark:text-slate-200">{pred.confidenceScore}%</strong></span>
                <span className="text-slate-500">{pred.timeframe}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
