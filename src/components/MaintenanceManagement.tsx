import React, { useState, useEffect, useMemo } from "react";
import { Wrench, Plus, Search, ListFilter as Filter, X, Calendar, Clock, DollarSign, TriangleAlert as AlertTriangle, Activity, ClipboardList, User, Cog, Package, FileText, ChartBar as BarChart3, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { MaintenanceRecord, Asset } from "../types";

interface MaintenanceManagementProps {
  maintenanceRecords: MaintenanceRecord[];
  assets: Asset[];
  selectedPropertyId: string;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
}

const MAINTENANCE_TYPES: MaintenanceRecord["type"][] = [
  "Preventive",
  "Corrective",
  "Predictive",
  "Emergency",
];

const MAINTENANCE_STATUSES: MaintenanceRecord["status"][] = [
  "Scheduled",
  "In-Progress",
  "Completed",
  "Overdue",
];

const STORAGE_KEY = "blcts-maintenance-records";

const TYPE_STYLES: Record<MaintenanceRecord["type"], { badge: string; dot: string; bar: string }> = {
  Preventive: {
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
    bar: "#10b981",
  },
  Corrective: {
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
    bar: "#f59e0b",
  },
  Predictive: {
    badge:
      "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900/50",
    dot: "bg-sky-500",
    bar: "#0ea5e9",
  },
  Emergency: {
    badge:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-500",
    bar: "#f43f5e",
  },
};

const STATUS_STYLES: Record<MaintenanceRecord["status"], { badge: string; dot: string }> = {
  Scheduled: {
    badge:
      "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900/50",
    dot: "bg-sky-500",
  },
  "In-Progress": {
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  Completed: {
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
  },
  Overdue: {
    badge:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-500",
  },
};

// Format KSh currency with millions/k compact formatting
const formatKSh = (value: number): string => {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const formatted =
      millions >= 100
        ? millions.toFixed(0)
        : millions >= 10
        ? millions.toFixed(1)
        : millions.toFixed(2);
    return `KSh ${formatted}M`;
  }
  if (value >= 1_000) {
    return `KSh ${(value / 1_000).toFixed(0)}K`;
  }
  return `KSh ${value.toLocaleString()}`;
};

// Format full KSh currency (no compacting)
const formatKShFull = (value: number): string =>
  `KSh ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const emptyForm = {
  type: "Preventive" as MaintenanceRecord["type"],
  assetId: "",
  vendor: "",
  date: "",
  cost: 0,
  status: "Scheduled" as MaintenanceRecord["status"],
  technician: "",
  downtime: 0,
  partsUsed: "",
  labourHours: 0,
  notes: "",
};

export default function MaintenanceManagement({
  maintenanceRecords,
  assets,
  selectedPropertyId,
  triggerToast,
}: MaintenanceManagementProps) {
  const [localRecords, setLocalRecords] = useState<MaintenanceRecord[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [newRecord, setNewRecord] = useState({ ...emptyForm });

  // Load persisted records from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MaintenanceRecord[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLocalRecords(parsed);
        }
      }
    } catch (err) {
          }
  }, []);

  // Persist local records to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localRecords));
    } catch (err) {
          }
  }, [localRecords]);

  // Merge prop records with locally-persisted records (props take precedence by id)
  const allRecords = useMemo(() => {
    const propIds = new Set(maintenanceRecords.map((r) => r.id));
    const merged = [...maintenanceRecords];
    for (const lr of localRecords) {
      if (!propIds.has(lr.id)) merged.push(lr);
    }
    return merged;
  }, [maintenanceRecords, localRecords]);

  // Filter by selected property
  const propertyRecords = useMemo(
    () => allRecords.filter((r) => r.propertyId === selectedPropertyId),
    [allRecords, selectedPropertyId]
  );

  // Asset lookup map
  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    for (const a of assets) map.set(a.id, a);
    return map;
  }, [assets]);

  // Assets belonging to this property (for the add-record dropdown)
  const propertyAssets = useMemo(
    () => assets.filter((a) => a.propertyId === selectedPropertyId),
    [assets, selectedPropertyId]
  );

  // Apply search + type + status filters
  const visibleRecords = useMemo(() => {
    let list = propertyRecords;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.vendor.toLowerCase().includes(q) ||
          (r.technician ?? "").toLowerCase().includes(q) ||
          (r.partsUsed ?? "").toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          (assetMap.get(r.assetId ?? "")?.name ?? "").toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "All") {
      list = list.filter((r) => r.type === typeFilter);
    }

    if (statusFilter !== "All") {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Sort by date descending
    const sorted = [...list].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted;
  }, [propertyRecords, searchQuery, typeFilter, statusFilter, assetMap]);

  // Summary metrics
  const summary = useMemo(() => {
    const total = propertyRecords.length;
    const totalCost = propertyRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
    const preventive = propertyRecords.filter((r) => r.type === "Preventive").length;
    const corrective = propertyRecords.filter((r) => r.type === "Corrective").length;
    const ratio =
      corrective === 0
        ? preventive > 0
          ? "100:0"
          : "—"
        : `${preventive}:${corrective}`;
    const overdue = propertyRecords.filter((r) => r.status === "Overdue").length;
    return { total, totalCost, ratio, overdue };
  }, [propertyRecords]);

  // Bar chart data: maintenance cost by type
  const chartData = useMemo(() => {
    return MAINTENANCE_TYPES.map((type) => ({
      type,
      cost: propertyRecords
        .filter((r) => r.type === type)
        .reduce((sum, r) => sum + (r.cost || 0), 0),
    }));
  }, [propertyRecords]);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRecord.date) {
      triggerToast("Please select a maintenance date.", "warning");
      return;
    }
    if (!newRecord.vendor.trim()) {
      triggerToast("Please specify a vendor.", "warning");
      return;
    }
    if (newRecord.cost < 0) {
      triggerToast("Cost cannot be negative.", "warning");
      return;
    }

    const created: MaintenanceRecord = {
      id: `mrec-${Date.now()}`,
      propertyId: selectedPropertyId,
      assetId: newRecord.assetId || undefined,
      type: newRecord.type,
      cost: Number(newRecord.cost) || 0,
      vendor: newRecord.vendor.trim(),
      date: newRecord.date,
      status: newRecord.status,
      notes: newRecord.notes.trim(),
      technician: newRecord.technician.trim() || undefined,
      downtime: Number(newRecord.downtime) || 0,
      partsUsed: newRecord.partsUsed.trim() || undefined,
      labourHours: Number(newRecord.labourHours) || 0,
      attachments: [],
    };

    setLocalRecords((prev) => [...prev, created]);
    setIsAddModalOpen(false);
    setNewRecord({ ...emptyForm });
    triggerToast("Maintenance record added successfully.", "success");
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setNewRecord({ ...emptyForm });
  };

  return (
    <div className="space-y-8 text-left animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Maintenance Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track preventive, corrective, predictive, and emergency maintenance
            activities across the property portfolio.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Record</span>
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                Total Records
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {summary.total}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                Total Cost
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatKSh(summary.totalCost)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                Preventive : Corrective
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {summary.ratio}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                summary.overdue > 0
                  ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                Overdue
              </span>
              <span
                className={`text-2xl font-black font-mono ${
                  summary.overdue > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {summary.overdue}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Maintenance Cost by Type
          </h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatKSh(v)}
              />
              <Tooltip
                cursor={{ fill: "rgba(16,185,129,0.06)" }}
                contentStyle={{
                  backgroundColor: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
                labelStyle={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", fontSize: "10px" }}
                formatter={(value: number) => [formatKShFull(value), "Cost"]}
              />
              <Bar dataKey="cost" radius={[6, 6, 0, 0]} maxBarSize={64}>
                {chartData.map((entry) => (
                  <Cell key={entry.type} fill={TYPE_STYLES[entry.type].bar} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOOLBAR: search + filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vendor, technician, parts, or asset..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">All Types</option>
            {MAINTENANCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {MAINTENANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RECORDS LIST */}
      {visibleRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Wrench className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No maintenance records found
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-light">
            {propertyRecords.length === 0
              ? "This property has no maintenance records yet. Click \"Add Record\" to begin tracking."
              : "No records match your current search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRecords.map((record) => {
            const typeStyle = TYPE_STYLES[record.type];
            const statusStyle = STATUS_STYLES[record.status];
            const assetName = record.assetId
              ? assetMap.get(record.assetId)?.name ?? "Unknown Asset"
              : "General / Property-wide";

            return (
              <div
                key={record.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)] space-y-4"
              >
                {/* Top row: type + status + date + cost */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${typeStyle.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
                      {record.type}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusStyle.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {record.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3" />
                      {formatDate(record.date)}
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatKShFull(record.cost)}
                    </span>
                  </div>
                </div>

                {/* Asset + vendor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Cog className="w-3 h-3" /> Asset
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {assetName}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Package className="w-3 h-3" /> Vendor
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {record.vendor}
                    </span>
                  </div>
                </div>

                {/* Technician + downtime + parts + labour */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <User className="w-3 h-3" /> Technician
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {record.technician || "—"}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Downtime
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {record.downtime ? `${record.downtime} hrs` : "—"}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> Parts Used
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {record.partsUsed || "—"}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Labour Hours
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {record.labourHours ? `${record.labourHours} hrs` : "—"}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {record.notes && (
                  <div className="space-y-0.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Notes
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                      {record.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ADD RECORD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Add Maintenance Record
              </h3>
              <button
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-4">
              {/* Type + status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </label>
                  <select
                    value={newRecord.type}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        type: e.target.value as MaintenanceRecord["type"],
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {MAINTENANCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={newRecord.status}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        status: e.target.value as MaintenanceRecord["status"],
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {MAINTENANCE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Asset */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Asset
                </label>
                <select
                  value={newRecord.assetId}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, assetId: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">General / Property-wide</option>
                  {propertyAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor + date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Vendor
                  </label>
                  <input
                    type="text"
                    required
                    value={newRecord.vendor}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, vendor: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. CoolAir Kenya Ltd"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newRecord.date}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, date: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Cost + technician */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Cost (KSh)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newRecord.cost}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        cost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-600"
                    placeholder="e.g. 250000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Technician
                  </label>
                  <input
                    type="text"
                    value={newRecord.technician}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, technician: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. John Mwangi"
                  />
                </div>
              </div>

              {/* Downtime + labour hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Downtime (hrs)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newRecord.downtime}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        downtime: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Labour Hours
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newRecord.labourHours}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        labourHours: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Parts used */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Parts Used
                </label>
                <input
                  type="text"
                  value={newRecord.partsUsed}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, partsUsed: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Filter cartridge, 2x belts"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={newRecord.notes}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, notes: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Additional observations or work performed..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer text-center"
              >
                Add Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
