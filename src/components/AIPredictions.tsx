import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, TriangleAlert as AlertTriangle, Brain, Activity, Gauge, CircleCheck as CheckCircle2, ListFilter as Filter, ArrowUpDown, Lightbulb, Clock, Database, Target, Zap, ShieldAlert, ChevronDown } from "lucide-react";
import { AIPrediction, Anomaly } from "../types";
import {
  ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis,
  Tooltip, Legend
} from "recharts";

interface AIPredictionsProps {
  predictions: AIPrediction[];
  anomalies: Anomaly[];
  selectedPropertyId: string;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
}

const STORAGE_KEY = "blcts-anomalies";

const riskBadgeClasses: Record<string, string> = {
  Low: "bg-emerald-500 text-white",
  Medium: "bg-amber-500 text-white",
  High: "bg-orange-500 text-white",
  Critical: "bg-rose-500 text-white",
};

const riskBarClasses: Record<string, string> = {
  Low: "bg-emerald-500",
  Medium: "bg-amber-500",
  High: "bg-orange-500",
  Critical: "bg-rose-500",
};

const riskTextClasses: Record<string, string> = {
  Low: "text-emerald-600 dark:text-emerald-400",
  Medium: "text-amber-600 dark:text-amber-400",
  High: "text-orange-600 dark:text-orange-400",
  Critical: "text-rose-600 dark:text-rose-400",
};

const severityBadgeClasses: Record<string, string> = {
  Low: "bg-emerald-500 text-white",
  Medium: "bg-amber-500 text-white",
  High: "bg-orange-500 text-white",
  Critical: "bg-rose-500 text-white",
};

const severityBorderClasses: Record<string, string> = {
  Low: "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/10",
  Medium: "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/10",
  High: "border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/10",
  Critical: "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/10",
};

const riskRank: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

const formatKSh = (value: number): string => {
  const n = Number(value);
  if (isNaN(n)) return "KSh 0";
  if (Math.abs(n) >= 1_000_000_000) return `KSh ${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `KSh ${(n / 1_000).toFixed(0)}K`;
  return `KSh ${n.toLocaleString()}`;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function AIPredictions({
  predictions,
  anomalies,
  selectedPropertyId,
  triggerToast,
}: AIPredictionsProps) {
  // Filter to the selected property
  const propPredictions = useMemo(
    () => predictions.filter((p) => p.propertyId === selectedPropertyId),
    [predictions, selectedPropertyId]
  );
  const propAnomalies = useMemo(
    () => anomalies.filter((a) => a.propertyId === selectedPropertyId),
    [anomalies, selectedPropertyId]
  );

  // Resolved anomalies persisted in localStorage (by id)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setResolvedIds(new Set(parsed.filter((x) => typeof x === "string")));
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(resolvedIds)));
    } catch {
      // storage unavailable; non-fatal
    }
  }, [resolvedIds]);

  // Merge resolved state into anomalies
  const anomaliesWithState = useMemo(
    () =>
      propAnomalies.map((a) => ({
        ...a,
        isResolved: resolvedIds.has(a.id) ? true : a.isResolved,
      })),
    [propAnomalies, resolvedIds]
  );

  // Filters & sort
  const [predCategoryFilter, setPredCategoryFilter] = useState<string>("All");
  const [predSort, setPredSort] = useState<"confidence" | "risk">("confidence");
  const [anomalySeverityFilter, setAnomalySeverityFilter] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    propPredictions.forEach((p) => set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [propPredictions]);

  const filteredPredictions = useMemo(() => {
    let list = propPredictions.filter(
      (p) => predCategoryFilter === "All" || p.category === predCategoryFilter
    );
    list = [...list].sort((a, b) => {
      if (predSort === "confidence") return b.confidenceScore - a.confidenceScore;
      return riskRank[b.riskLevel] - riskRank[a.riskLevel];
    });
    return list;
  }, [propPredictions, predCategoryFilter, predSort]);

  const filteredAnomalies = useMemo(() => {
    return anomaliesWithState.filter(
      (a) => anomalySeverityFilter === "All" || a.severity === anomalySeverityFilter
    );
  }, [anomaliesWithState, anomalySeverityFilter]);

  // Summary metrics
  const totalPredictions = propPredictions.length;
  const avgConfidence =
    totalPredictions > 0
      ? Math.round(
          propPredictions.reduce((s, p) => s + p.confidenceScore, 0) / totalPredictions
        )
      : 0;
  const activeAnomalies = anomaliesWithState.filter((a) => !a.isResolved).length;
  const criticalAnomalies = anomaliesWithState.filter(
    (a) => !a.isResolved && a.severity === "Critical"
  ).length;

  // Radial chart data
  const radialData = useMemo(
    () =>
      filteredPredictions.map((p, i) => ({
        name: `P${i + 1}`,
        confidence: p.confidenceScore,
        fill:
          p.riskLevel === "Critical"
            ? "#f43f5e"
            : p.riskLevel === "High"
            ? "#f97316"
            : p.riskLevel === "Medium"
            ? "#f59e0b"
            : "#10b981",
      })),
    [filteredPredictions]
  );

  const handleResolve = (anomaly: Anomaly) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      next.add(anomaly.id);
      return next;
    });
    triggerToast(
      `Anomaly "${anomaly.category}" marked as resolved`,
      "success"
    );
  };

  const handleReopen = (anomaly: Anomaly) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      next.delete(anomaly.id);
      return next;
    });
    triggerToast(
      `Anomaly "${anomaly.category}" reopened`,
      "info"
    );
  };

  const summaryCards = [
    {
      label: "Total Predictions",
      value: totalPredictions.toString(),
      icon: Brain,
      color: "violet",
    },
    {
      label: "Avg Confidence",
      value: `${avgConfidence}%`,
      icon: Gauge,
      color: "emerald",
    },
    {
      label: "Active Anomalies",
      value: activeAnomalies.toString(),
      icon: AlertTriangle,
      color: activeAnomalies > 0 ? "amber" : "emerald",
    },
    {
      label: "Critical Anomalies",
      value: criticalAnomalies.toString(),
      icon: ShieldAlert,
      color: criticalAnomalies > 0 ? "rose" : "emerald",
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400",
    violet: "bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400",
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              AI Prediction Engine &amp; Anomaly Detection
            </h3>
          </div>
          <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider border border-violet-500/20">
            Analytics
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Analytics-driven forecasts for maintenance costs, budget overruns, and utility
          consumption — paired with anomaly detection across building lifecycle operations.
        </p>
      </div>

      {/* Summary Bar */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${colorMap[kpi.color]}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  {kpi.label}
                </span>
                <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white block font-mono mt-0.5">
                  {kpi.value}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* AI Predictions Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" /> AI Predictions
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={predCategoryFilter}
                onChange={(e) => setPredCategoryFilter(e.target.value)}
                className="appearance-none pl-8 pr-8 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Categories" : c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={predSort}
                onChange={(e) => setPredSort(e.target.value as "confidence" | "risk")}
                className="appearance-none pl-8 pr-8 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
              >
                <option value="confidence">Sort: Confidence</option>
                <option value="risk">Sort: Risk Level</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Radial Bar Chart */}
        {radialData.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-violet-500" /> Confidence Scores per Prediction
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="20%"
                  outerRadius="100%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    background={{ fill: "rgba(148,163,184,0.15)" }}
                    dataKey="confidence"
                    cornerRadius={6}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: "11px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(148,163,184,0.2)",
                      color: "#f1f5f9",
                    }}
                    formatter={(v: any) => [`${v}%`, "Confidence"]}
                  />
                  <Legend
                    iconType="circle"
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: "10px" }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Prediction Cards */}
        {filteredPredictions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No predictions available for the selected filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPredictions.map((pred) => (
              <div
                key={pred.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {pred.category}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${riskBadgeClasses[pred.riskLevel]}`}
                  >
                    {pred.riskLevel}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {pred.prediction}
                </p>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Predicted Value
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatKSh(pred.predictedValue)}
                  </span>
                </div>

                {/* Confidence progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                      Confidence
                    </span>
                    <span className={`font-mono font-bold ${riskTextClasses[pred.riskLevel]}`}>
                      {pred.confidenceScore}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${riskBarClasses[pred.riskLevel]} transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(0, pred.confidenceScore))}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Recommendation
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {pred.recommendation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Supporting Data
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {pred.supportingData}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Timeframe:
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      {pred.timeframe}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Anomaly Detection Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Anomaly Detection
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={anomalySeverityFilter}
                onChange={(e) => setAnomalySeverityFilter(e.target.value)}
                className="appearance-none pl-8 pr-8 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
              >
                <option value="All">All Severities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {filteredAnomalies.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No anomalies detected for the selected filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAnomalies.map((anom) => {
              const deviationColor =
                Math.abs(anom.deviationPercent) >= 50
                  ? "text-rose-600 dark:text-rose-400"
                  : Math.abs(anom.deviationPercent) >= 25
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-amber-600 dark:text-amber-400";
              return (
                <div
                  key={anom.id}
                  className={`p-4 rounded-xl border flex flex-col gap-3 transition-shadow hover:shadow-md ${
                    anom.isResolved
                      ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 opacity-70"
                      : severityBorderClasses[anom.severity]
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {anom.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {anom.isResolved && (
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Resolved
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${severityBadgeClasses[anom.severity]}`}
                      >
                        {anom.severity}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {anom.description}
                  </p>

                  {/* Detected vs Expected */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Detected
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block mt-0.5">
                        {formatKSh(anom.detectedValue)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Expected
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block mt-0.5">
                        {formatKSh(anom.expectedValue)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Deviation
                      </span>
                      <span className={`text-xs font-mono font-bold block mt-0.5 ${deviationColor}`}>
                        {anom.deviationPercent > 0 ? "+" : ""}
                        {anom.deviationPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 pt-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Recommendation
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {anom.recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(anom.detectedAt)}
                    </span>
                    {anom.isResolved ? (
                      <button
                        onClick={() => handleReopen(anom)}
                        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" /> Reopen
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResolve(anom)}
                        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
