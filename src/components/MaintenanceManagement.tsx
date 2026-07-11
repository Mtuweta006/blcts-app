import React, { useState, useEffect, useMemo } from "react";
import { Wrench, Plus, Search, ListFilter as Filter, X, Calendar, Clock, DollarSign, TriangleAlert as AlertTriangle, Activity, ClipboardList, User, Cog, Package, FileText, ChartBar as BarChart3, TrendingUp, Flag, CircleCheck as CheckCircle2, Pencil, Trash2 } from "lucide-react";
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
import { MaintenanceTask, MaintenanceStatus, MaintenancePriority, MaintenanceCategory, Asset, UserRole } from "../types";
import { WorkflowStepper, StatusBadge } from "./WorkflowComponents";

interface MaintenanceManagementProps {
  maintenanceRecords: MaintenanceTask[];
  assets: Asset[];
  selectedPropertyId: string;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
  currentUserRole?: UserRole;
}

const MAINTENANCE_CATEGORIES: MaintenanceCategory[] = [
  "Preventive",
  "Corrective",
  "Predictive",
  "Emergency",
  "Inspection",
];

const MAINTENANCE_STATUSES: MaintenanceStatus[] = [
  "Pending",
  "Assigned",
  "In-Progress",
  "Completed",
  "Verified",
  "Overdue",
];

const MAINTENANCE_PRIORITIES: MaintenancePriority[] = ["Low", "Medium", "High", "Critical"];

const STORAGE_KEY = "blcts-maintenance-tasks";

const CATEGORY_STYLES: Record<MaintenanceCategory, { badge: string; dot: string; bar: string }> = {
  Preventive: { badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50", dot: "bg-emerald-500", bar: "#10b981" },
  Corrective: { badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50", dot: "bg-amber-500", bar: "#f59e0b" },
  Predictive: { badge: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900/50", dot: "bg-sky-500", bar: "#0ea5e9" },
  Emergency: { badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50", dot: "bg-rose-500", bar: "#f43f5e" },
  Inspection: { badge: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200 dark:border-violet-900/50", dot: "bg-violet-500", bar: "#8b5cf6" },
};

const STATUS_STYLES: Record<MaintenanceStatus, { badge: string; dot: string }> = {
  Pending: { badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700", dot: "bg-slate-400" },
  Assigned: { badge: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900/50", dot: "bg-sky-500" },
  "In-Progress": { badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50", dot: "bg-amber-500" },
  Completed: { badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50", dot: "bg-emerald-500" },
  Verified: { badge: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-900/50", dot: "bg-teal-500" },
  Overdue: { badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50", dot: "bg-rose-500" },
};

const PRIORITY_STYLES: Record<MaintenancePriority, string> = {
  Low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  Medium: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  High: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  Critical: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
};

const formatKSh = (value: number): string => {
  if (value >= 1_000_000) return `KSh ${(value / 1_000_000).toFixed(value >= 100_000_000 ? 0 : value >= 10_000_000 ? 1 : 2)}M`;
  if (value >= 1_000) return `KSh ${(value / 1_000).toFixed(0)}K`;
  return `KSh ${value.toLocaleString()}`;
};

const formatKShFull = (value: number): string =>
  `KSh ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const emptyForm = {
  title: "",
  description: "",
  component: "",
  category: "Preventive" as MaintenanceCategory,
  priority: "Medium" as MaintenancePriority,
  status: "Pending" as MaintenanceStatus,
  assignedTo: "",
  technician: "",
  vendor: "",
  estimatedCost: 0,
  actualCost: 0,
  targetDate: "",
  notes: "",
  partsUsed: "",
  downtime: 0,
  labourHours: 0,
};

export default function MaintenanceManagement({
  maintenanceRecords,
  assets,
  selectedPropertyId,
  triggerToast,
  currentUserRole,
}: MaintenanceManagementProps) {
  const [localRecords, setLocalRecords] = useState<MaintenanceTask[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [newRecord, setNewRecord] = useState({ ...emptyForm });

  const canEdit = currentUserRole !== "Building Owner";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MaintenanceTask[] = JSON.parse(stored);
        if (Array.isArray(parsed)) setLocalRecords(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localRecords));
    } catch {}
  }, [localRecords]);

  const allRecords = useMemo(() => {
    const propIds = new Set(maintenanceRecords.map((r) => r.id));
    const merged = [...maintenanceRecords];
    for (const lr of localRecords) {
      if (!propIds.has(lr.id)) merged.push(lr);
      else {
        const idx = merged.findIndex((m) => m.id === lr.id);
        if (idx >= 0) merged[idx] = lr;
      }
    }
    return merged;
  }, [maintenanceRecords, localRecords]);

  const propertyRecords = useMemo(
    () => allRecords.filter((r) => r.propertyId === selectedPropertyId),
    [allRecords, selectedPropertyId]
  );

  const visibleRecords = useMemo(() => {
    let list = propertyRecords;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.vendor.toLowerCase().includes(q) ||
          (r.technician || "").toLowerCase().includes(q) ||
          (r.partsUsed || "").toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.component.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "All") list = list.filter((r) => r.category === categoryFilter);
    if (statusFilter !== "All") list = list.filter((r) => r.status === statusFilter);
    return [...list].sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime());
  }, [propertyRecords, searchQuery, categoryFilter, statusFilter]);

  const summary = useMemo(() => {
    const total = propertyRecords.length;
    const totalCost = propertyRecords.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0);
    const preventive = propertyRecords.filter((r) => r.category === "Preventive").length;
    const corrective = propertyRecords.filter((r) => r.category === "Corrective").length;
    const ratio = corrective === 0 ? (preventive > 0 ? "100:0" : "—") : `${preventive}:${corrective}`;
    const overdue = propertyRecords.filter((r) => r.status === "Overdue").length;
    const pending = propertyRecords.filter((r) => r.status === "Pending").length;
    return { total, totalCost, ratio, overdue, pending };
  }, [propertyRecords]);

  const chartData = useMemo(() => {
    return MAINTENANCE_CATEGORIES.map((cat) => ({
      type: cat,
      cost: propertyRecords
        .filter((r) => r.category === cat)
        .reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0),
    }));
  }, [propertyRecords]);

  const handleStatusChange = (id: string, newStatus: MaintenanceStatus) => {
    const record = allRecords.find((r) => r.id === id);
    if (!record) return;

    const updated: MaintenanceTask = {
      ...record,
      status: newStatus,
      completedDate: newStatus === "Completed" || newStatus === "Verified" ? new Date().toISOString().slice(0, 10) : record.completedDate,
      verifiedBy: newStatus === "Verified" ? "Current User" : record.verifiedBy,
    };

    setLocalRecords((prev) => {
      const existing = prev.find((r) => r.id === id);
      if (existing) return prev.map((r) => (r.id === id ? updated : r));
      return [...prev, updated];
    });
    triggerToast(`Task status updated to "${newStatus}".`, "success");
  };

  const handleDelete = (id: string) => {
    setLocalRecords((prev) => prev.filter((r) => r.id !== id));
    triggerToast("Maintenance task deleted.", "info");
  };

  const handleEdit = (record: MaintenanceTask) => {
    setEditingId(record.id);
    setNewRecord({
      title: record.title,
      description: record.description,
      component: record.component,
      category: record.category,
      priority: record.priority,
      status: record.status,
      assignedTo: record.assignedTo,
      technician: record.technician,
      vendor: record.vendor,
      estimatedCost: record.estimatedCost,
      actualCost: record.actualCost,
      targetDate: record.targetDate,
      notes: record.notes,
      partsUsed: record.partsUsed || "",
      downtime: record.downtime || 0,
      labourHours: record.labourHours || 0,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRecord.title.trim()) { triggerToast("Please enter a task title.", "warning"); return; }
    if (!newRecord.component.trim()) { triggerToast("Please specify the component or system.", "warning"); return; }
    if (!newRecord.vendor.trim()) { triggerToast("Please specify a vendor or contractor.", "warning"); return; }
    if (!newRecord.targetDate) { triggerToast("Please select a target date.", "warning"); return; }
    if (newRecord.estimatedCost < 0) { triggerToast("Estimated cost cannot be negative.", "warning"); return; }
    if (newRecord.actualCost < 0) { triggerToast("Actual cost cannot be negative.", "warning"); return; }

    const today = new Date().toISOString().slice(0, 10);
    let finalStatus = newRecord.status;
    if (newRecord.targetDate < today && newRecord.status === "Pending") finalStatus = "Overdue";

    if (editingId) {
      const existing = allRecords.find((r) => r.id === editingId);
      if (existing) {
        const updated: MaintenanceTask = {
          ...existing,
          title: newRecord.title.trim(),
          description: newRecord.description.trim(),
          component: newRecord.component.trim(),
          category: newRecord.category,
          priority: newRecord.priority,
          status: finalStatus,
          assignedTo: newRecord.assignedTo.trim(),
          technician: newRecord.technician.trim(),
          vendor: newRecord.vendor.trim(),
          estimatedCost: Number(newRecord.estimatedCost) || 0,
          actualCost: Number(newRecord.actualCost) || 0,
          targetDate: newRecord.targetDate,
          notes: newRecord.notes.trim(),
          partsUsed: newRecord.partsUsed.trim(),
          downtime: Number(newRecord.downtime) || 0,
          labourHours: Number(newRecord.labourHours) || 0,
        };
        setLocalRecords((prev) => {
          const found = prev.find((r) => r.id === editingId);
          if (found) return prev.map((r) => (r.id === editingId ? updated : r));
          return [...prev, updated];
        });
        triggerToast("Maintenance task updated successfully.", "success");
      }
    } else {
      const created: MaintenanceTask = {
        id: `mtask-${Date.now()}`,
        propertyId: selectedPropertyId,
        title: newRecord.title.trim(),
        description: newRecord.description.trim(),
        component: newRecord.component.trim(),
        category: newRecord.category,
        priority: newRecord.priority,
        status: finalStatus,
        assignedTo: newRecord.assignedTo.trim(),
        technician: newRecord.technician.trim(),
        vendor: newRecord.vendor.trim(),
        estimatedCost: Number(newRecord.estimatedCost) || 0,
        actualCost: Number(newRecord.actualCost) || 0,
        targetDate: newRecord.targetDate,
        notes: newRecord.notes.trim(),
        partsUsed: newRecord.partsUsed.trim(),
        downtime: Number(newRecord.downtime) || 0,
        labourHours: Number(newRecord.labourHours) || 0,
        attachments: [],
        workOrderNumber: `WO-${Date.now().toString().slice(-6)}`,
      };
      setLocalRecords((prev) => [...prev, created]);
      triggerToast("Maintenance task created successfully.", "success");
    }

    setIsAddModalOpen(false);
    setEditingId(null);
    setNewRecord({ ...emptyForm });
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingId(null);
    setNewRecord({ ...emptyForm });
  };

  return (
    <div className="space-y-8 text-left animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Maintenance Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track preventive, corrective, predictive, and emergency maintenance activities across the property portfolio.
          </p>
          <div className="mt-3">
            <WorkflowStepper
              steps={[
                { label: "Need Identified", status: "completed" },
                { label: "Task Created", status: "completed" },
                { label: "Assigned", status: "pending" },
                { label: "In Progress", status: "pending" },
                { label: "Completed", status: "pending" },
                { label: "Verified", status: "pending" },
                { label: "Cost Recorded", status: "pending" },
              ]}
            />
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditingId(null); setNewRecord({ ...emptyForm }); setIsAddModalOpen(true); }}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{editingId ? "Update Task" : "Add Task"}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><ClipboardList className="w-5 h-5" /></div>
            <div><span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Total Tasks</span><span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{summary.total}</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><DollarSign className="w-5 h-5" /></div>
            <div><span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Total Cost</span><span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatKSh(summary.totalCost)}</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            <div><span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Preventive : Corrective</span><span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{summary.ratio}</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${summary.overdue > 0 ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"}`}><AlertTriangle className="w-5 h-5" /></div>
            <div><span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Overdue</span><span className={`text-2xl font-black font-mono ${summary.overdue > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>{summary.overdue}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Maintenance Cost by Category</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
              <XAxis dataKey="type" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatKSh(v)} />
              <Tooltip cursor={{ fill: "rgba(16,185,129,0.06)" }} contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "12px", fontSize: "12px", color: "#f1f5f9" }} labelStyle={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", fontSize: "10px" }} formatter={(value: number) => [formatKShFull(value), "Cost"]} />
              <Bar dataKey="cost" radius={[6, 6, 0, 0]} maxBarSize={64}>
                {chartData.map((entry) => (
                  <Cell key={entry.type} fill={CATEGORY_STYLES[entry.type as MaintenanceCategory]?.bar || "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title, vendor, technician, component..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer">
            <option value="All">All Categories</option>
            {MAINTENANCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer">
            <option value="All">All Statuses</option>
            {MAINTENANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {visibleRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Wrench className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No maintenance tasks found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-light">
            {propertyRecords.length === 0 ? "This property has no maintenance tasks yet." : "No tasks match your current search or filter criteria."}
          </p>
          {canEdit && propertyRecords.length === 0 && (
            <button onClick={() => setIsAddModalOpen(true)} className="mt-4 bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all cursor-pointer">
              Create First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRecords.map((record) => {
            const catStyle = CATEGORY_STYLES[record.category];
            const statusStyle = STATUS_STYLES[record.status];
            return (
              <div key={record.id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${catStyle.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />{record.category}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusStyle.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />{record.status}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${PRIORITY_STYLES[record.priority]}`}>
                      <Flag className="w-3 h-3" />{record.priority}
                    </span>
                    {record.workOrderNumber && (
                      <span className="text-[10px] font-mono text-slate-400">{record.workOrderNumber}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3" />{formatDate(record.targetDate)}
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatKShFull(record.actualCost || record.estimatedCost)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{record.title}</h4>
                  {record.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{record.description}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1"><Cog className="w-3 h-3" /> Component</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">{record.component}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1"><Package className="w-3 h-3" /> Vendor</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">{record.vendor}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1"><User className="w-3 h-3" /> Technician</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">{record.technician || "—"}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Downtime</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">{record.downtime ? `${record.downtime} hrs` : "—"}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1"><Wrench className="w-3 h-3" /> Parts Used</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">{record.partsUsed || "—"}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1"><Activity className="w-3 h-3" /> Labour Hours</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">{record.labourHours ? `${record.labourHours} hrs` : "—"}</span>
                  </div>
                </div>

                {record.notes && (
                  <div className="space-y-0.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1"><FileText className="w-3 h-3" /> Notes</span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-light">{record.notes}</p>
                  </div>
                )}

                {canEdit && (
                  <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <select
                      value={record.status}
                      onChange={(e) => handleStatusChange(record.id, e.target.value as MaintenanceStatus)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {MAINTENANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => handleEdit(record)} className="p-1.5 text-slate-400 hover:text-sky-500 rounded-lg transition-colors cursor-pointer" title="Edit task">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(record.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer" title="Delete task">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {editingId ? "Edit Maintenance Task" : "Add Maintenance Task"}
              </h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title *</label>
                <input type="text" required value={newRecord.title} onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. HVAC Filter Replacement" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <textarea rows={2} value={newRecord.description} onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none" placeholder="Brief description of the maintenance task..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
                  <select value={newRecord.category} onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value as MaintenanceCategory })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer">
                    {MAINTENANCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</label>
                  <select value={newRecord.priority} onChange={(e) => setNewRecord({ ...newRecord, priority: e.target.value as MaintenancePriority })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer">
                    {MAINTENANCE_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
                  <select value={newRecord.status} onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value as MaintenanceStatus })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer">
                    {MAINTENANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Date *</label>
                  <input type="date" required value={newRecord.targetDate} onChange={(e) => setNewRecord({ ...newRecord, targetDate: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Component / System *</label>
                <input type="text" required value={newRecord.component} onChange={(e) => setNewRecord({ ...newRecord, component: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. HVAC System, Elevator Motor" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendor / Contractor *</label>
                  <input type="text" required value={newRecord.vendor} onChange={(e) => setNewRecord({ ...newRecord, vendor: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. CoolAir Kenya Ltd" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned To</label>
                  <input type="text" value={newRecord.assignedTo} onChange={(e) => setNewRecord({ ...newRecord, assignedTo: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. James Otieno" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Technician</label>
                  <input type="text" value={newRecord.technician} onChange={(e) => setNewRecord({ ...newRecord, technician: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. John Mwangi" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estimated Cost (KSh)</label>
                  <input type="number" min={0} value={newRecord.estimatedCost} onChange={(e) => setNewRecord({ ...newRecord, estimatedCost: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-600" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actual Cost (KSh)</label>
                  <input type="number" min={0} value={newRecord.actualCost} onChange={(e) => setNewRecord({ ...newRecord, actualCost: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Downtime (hrs)</label>
                  <input type="number" min={0} value={newRecord.downtime} onChange={(e) => setNewRecord({ ...newRecord, downtime: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Labour Hours</label>
                  <input type="number" min={0} value={newRecord.labourHours} onChange={(e) => setNewRecord({ ...newRecord, labourHours: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Parts Used</label>
                  <input type="text" value={newRecord.partsUsed} onChange={(e) => setNewRecord({ ...newRecord, partsUsed: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. Filter cartridge, 2x belts" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes</label>
                <textarea rows={3} value={newRecord.notes} onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none" placeholder="Additional observations or work performed..." />
              </div>

              <button type="submit" className="w-full bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer text-center">
                {editingId ? "Update Task" : "Create Task"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
