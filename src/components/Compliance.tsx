import React, { useState, useEffect, useMemo } from "react";
import { ShieldCheck, Plus, X, ListFilter as Filter, Search, Calendar, Building2, Flame, HardHat, Leaf, HardDrive, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Circle as XCircle, Clock, FileText, Scale, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ComplianceItem } from "../types";

interface ComplianceProps {
  compliance: ComplianceItem[];
  selectedPropertyId: string;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
}

const STORAGE_KEY = "blcts-compliance";

const CATEGORIES: ComplianceItem["category"][] = [
  "Building Codes",
  "Fire Safety",
  "OSHA",
  "Environmental",
  "Structural Inspection",
];

const STATUSES: ComplianceItem["status"][] = [
  "Compliant",
  "Non-Compliant",
  "Pending Review",
  "Expired",
];

const CATEGORY_META: Record<
  ComplianceItem["category"],
  { icon: React.ElementType; badge: string }
> = {
  "Building Codes": {
    icon: Building2,
    badge:
      "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900/50",
  },
  "Fire Safety": {
    icon: Flame,
    badge:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
  },
  OSHA: {
    icon: HardHat,
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  },
  Environmental: {
    icon: Leaf,
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  },
  "Structural Inspection": {
    icon: HardDrive,
    badge:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

const STATUS_META: Record<
  ComplianceItem["status"],
  { badge: string; dot: string; icon: React.ElementType; color: string }
> = {
  Compliant: {
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
    color: "#10b981",
  },
  "Non-Compliant": {
    badge:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-500",
    icon: XCircle,
    color: "#f43f5e",
  },
  "Pending Review": {
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
    icon: Clock,
    color: "#f59e0b",
  },
  Expired: {
    badge:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-500",
    icon: AlertTriangle,
    color: "#e11d48",
  },
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const emptyForm = {
  regulation: "",
  category: "Building Codes" as ComplianceItem["category"],
  status: "Pending Review" as ComplianceItem["status"],
  lastInspectionDate: "",
  nextInspectionDate: "",
  authority: "",
  notes: "",
};

export default function Compliance({
  compliance,
  selectedPropertyId,
  triggerToast,
}: ComplianceProps) {
  const [localRecords, setLocalRecords] = useState<ComplianceItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [newRecord, setNewRecord] = useState({ ...emptyForm });

  // Load persisted records from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ComplianceItem[] = JSON.parse(stored);
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
    const propIds = new Set(compliance.map((r) => r.id));
    const merged = [...compliance];
    for (const lr of localRecords) {
      if (!propIds.has(lr.id)) merged.push(lr);
    }
    return merged;
  }, [compliance, localRecords]);

  // Filter by selected property
  const propertyRecords = useMemo(
    () => allRecords.filter((r) => r.propertyId === selectedPropertyId),
    [allRecords, selectedPropertyId]
  );

  // Apply search + category + status filters
  const visibleRecords = useMemo(() => {
    let list = propertyRecords;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.regulation.toLowerCase().includes(q) ||
          r.authority.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "All") {
      list = list.filter((r) => r.category === categoryFilter);
    }

    if (statusFilter !== "All") {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Sort by next inspection date ascending (earliest first), undated last
    const sorted = [...list].sort((a, b) => {
      const ad = a.nextInspectionDate
        ? new Date(a.nextInspectionDate).getTime()
        : Number.POSITIVE_INFINITY;
      const bd = b.nextInspectionDate
        ? new Date(b.nextInspectionDate).getTime()
        : Number.POSITIVE_INFINITY;
      return ad - bd;
    });
    return sorted;
  }, [propertyRecords, searchQuery, categoryFilter, statusFilter]);

  // Summary metrics
  const summary = useMemo(() => {
    const total = propertyRecords.length;
    const compliant = propertyRecords.filter(
      (r) => r.status === "Compliant"
    ).length;
    const nonCompliant = propertyRecords.filter(
      (r) => r.status === "Non-Compliant"
    ).length;
    const pending = propertyRecords.filter(
      (r) => r.status === "Pending Review"
    ).length;
    const expired = propertyRecords.filter(
      (r) => r.status === "Expired"
    ).length;
    const score =
      total > 0 ? Math.round((compliant / total) * 100) : 0;
    return { total, compliant, nonCompliant, pending, expired, score };
  }, [propertyRecords]);

  // Donut chart data for compliance score
  const scoreData = useMemo(
    () => [
      { name: "Compliant", value: summary.compliant, color: "#10b981" },
      { name: "Non-Compliant", value: summary.nonCompliant, color: "#f43f5e" },
      { name: "Pending Review", value: summary.pending, color: "#f59e0b" },
      { name: "Expired", value: summary.expired, color: "#e11d48" },
    ],
    [summary]
  );

  const scoreColor =
    summary.score >= 80
      ? "#10b981"
      : summary.score >= 60
      ? "#f59e0b"
      : summary.score >= 40
      ? "#fb923c"
      : "#f43f5e";

  const scoreLabel =
    summary.score >= 80
      ? "Strong"
      : summary.score >= 60
      ? "Moderate"
      : summary.score >= 40
      ? "At Risk"
      : "Critical";

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRecord.regulation.trim()) {
      triggerToast("Please enter a regulation name.", "warning");
      return;
    }
    if (!newRecord.authority.trim()) {
      triggerToast("Please specify the regulatory authority.", "warning");
      return;
    }
    if (
      newRecord.nextInspectionDate &&
      newRecord.lastInspectionDate &&
      new Date(newRecord.nextInspectionDate) <
        new Date(newRecord.lastInspectionDate)
    ) {
      triggerToast(
        "Next inspection date cannot be before last inspection date.",
        "warning"
      );
      return;
    }

    const created: ComplianceItem = {
      id: `comp-${Date.now()}`,
      propertyId: selectedPropertyId,
      regulation: newRecord.regulation.trim(),
      category: newRecord.category,
      status: newRecord.status,
      lastInspectionDate: newRecord.lastInspectionDate,
      nextInspectionDate: newRecord.nextInspectionDate,
      authority: newRecord.authority.trim(),
      notes: newRecord.notes.trim(),
    };

    setLocalRecords((prev) => [...prev, created]);
    setIsAddModalOpen(false);
    setNewRecord({ ...emptyForm });
    triggerToast("Compliance item added successfully.", "success");
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setNewRecord({ ...emptyForm });
  };

  const summaryCards = [
    {
      label: "Total Items",
      value: summary.total,
      icon: ShieldCheck,
      color:
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
    },
    {
      label: "Compliant",
      value: summary.compliant,
      icon: CheckCircle2,
      color:
        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Non-Compliant",
      value: summary.nonCompliant,
      icon: XCircle,
      color: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
    },
    {
      label: "Pending Review",
      value: summary.pending,
      icon: Clock,
      color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Compliance Score",
      value: `${summary.score}%`,
      icon: Activity,
      color:
        summary.score >= 80
          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
          : summary.score >= 60
          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
          : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-8 text-left animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Compliance Tracking
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor regulatory adherence across building codes, fire safety,
            OSHA, environmental, and structural inspection requirements.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Compliance Item</span>
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                    {card.label}
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {card.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPLIANCE SCORE GAUGE + BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut gauge */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)] flex flex-col items-center justify-center">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2 self-start">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Compliance Score
          </h3>
          <div className="relative w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="72%"
                  outerRadius="100%"
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {scoreData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-3xl font-black font-mono"
                style={{ color: scoreColor }}
              >
                {summary.score}%
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
                style={{ color: scoreColor }}
              >
                {scoreLabel}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 text-center">
            {summary.compliant} of {summary.total} items compliant
          </p>
        </div>

        {/* Status breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)] lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Status Breakdown
          </h3>
          <div className="space-y-3">
            {STATUSES.map((status) => {
              const meta = STATUS_META[status];
              const count = propertyRecords.filter(
                (r) => r.status === status
              ).length;
              const pct =
                summary.total > 0
                  ? Math.round((count / summary.total) * 100)
                  : 0;
              const Icon = meta.icon;
              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                      <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                      {status}
                    </span>
                    <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                      {count}{" "}
                      <span className="text-slate-400 dark:text-slate-500 font-normal">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
            placeholder="Search by regulation, authority, notes, or category..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
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
            {STATUSES.map((s) => (
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
          <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No compliance items found
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-light">
            {propertyRecords.length === 0
              ? 'This property has no compliance records yet. Click "Add Compliance Item" to begin tracking.'
              : "No records match your current search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRecords.map((record) => {
            const catMeta = CATEGORY_META[record.category];
            const statusMeta = STATUS_META[record.status];
            const CatIcon = catMeta.icon;
            const StatusIcon = statusMeta.icon;

            return (
              <div
                key={record.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)] space-y-4"
              >
                {/* Top row: regulation + badges */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {record.regulation}
                    </h4>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${catMeta.badge}`}
                      >
                        <CatIcon className="w-3 h-3" />
                        {record.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusMeta.badge}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}
                        />
                        {record.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates + authority */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Last Inspection
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {formatDate(record.lastInspectionDate)}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Next Inspection
                    </span>
                    <span
                      className={`font-medium block ${
                        record.nextInspectionDate &&
                        new Date(record.nextInspectionDate) < new Date()
                          ? "text-rose-600 dark:text-rose-400 font-bold"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {formatDate(record.nextInspectionDate)}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Authority
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {record.authority}
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

      {/* ADD COMPLIANCE ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Add Compliance Item
              </h3>
              <button
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-4">
              {/* Regulation */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Regulation *
                </label>
                <input
                  type="text"
                  required
                  value={newRecord.regulation}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, regulation: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. International Building Code 2021 §903"
                />
              </div>

              {/* Category + status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={newRecord.category}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        category: e.target.value as ComplianceItem["category"],
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
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
                        status: e.target.value as ComplianceItem["status"],
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Last Inspection Date
                  </label>
                  <input
                    type="date"
                    value={newRecord.lastInspectionDate}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        lastInspectionDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Next Inspection Date
                  </label>
                  <input
                    type="date"
                    value={newRecord.nextInspectionDate}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        nextInspectionDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Authority */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Authority *
                </label>
                <input
                  type="text"
                  required
                  value={newRecord.authority}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, authority: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Nairobi City County Fire Department"
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
                  placeholder="Findings, corrective actions, or reference numbers..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer text-center"
              >
                Add Compliance Item
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
