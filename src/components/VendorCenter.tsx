import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Trash2, CreditCard as Edit, X, Building2, Tag, FileSpreadsheet, CircleAlert as AlertCircle, Star, Truck, CreditCard, ShieldCheck, Mail, Phone, MapPin, Calendar, TrendingUp, Leaf, Clock, Package, Users, Award, Briefcase, ChevronDown, ChevronUp, Upload } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from "recharts";
import type { Vendor, Material } from "../types";

interface VendorCenterProps {
  vendors: Vendor[];
  materials: Material[];
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
}

const VENDOR_TYPES = ["Contractor", "Supplier", "Consultant", "Engineer"] as const;
type VendorType = (typeof VENDOR_TYPES)[number];

const TYPE_STYLES: Record<VendorType, { badge: string; dot: string; chart: string }> = {
  Contractor: {
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
    dot: "bg-amber-500",
    chart: "#f59e0b",
  },
  Supplier: {
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50",
    dot: "bg-blue-500",
    chart: "#3b82f6",
  },
  Consultant: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
    chart: "#10b981",
  },
  Engineer: {
    badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-500",
    chart: "#64748b",
  },
};

const AVAILABILITY_STYLES: Record<Material["availability"], string> = {
  "In Stock": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
  "Low Stock": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
  "Out of Stock": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50",
  "Pre-Order": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50",
};

const formatKSh = (n: number) => `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

const formatDate = (d: string) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const emptyVendor = (): Vendor => ({
  id: `vendor-${Date.now()}`,
  name: "",
  type: "Contractor",
  category: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  contractValue: 0,
  contractExpiry: "",
  performanceRating: 0,
  deliveryOnTimeRate: 0,
  paymentTerms: "Net 30",
  complianceCertified: false,
  complianceExpiry: "",
  deliveryHistory: [],
  paymentHistory: [],
});

const emptyMaterial = (): Material => ({
  id: `mat-${Date.now()}`,
  name: "",
  category: "",
  supplier: "",
  manufacturer: "",
  unit: "",
  currentPrice: 0,
  historicalPrices: [],
  leadTimeDays: 0,
  availability: "In Stock",
  carbonFootprint: 0,
});

export default function VendorCenter({ vendors, materials, triggerToast }: VendorCenterProps) {
  const [activeTab, setActiveTab] = useState<"vendors" | "materials">("vendors");

  // Persisted state — props seed initial values, localStorage overrides if present.
  const [vendorList, setVendorList] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem("blcts-vendors");
    return saved ? (JSON.parse(saved) as Vendor[]) : vendors;
  });
  const [materialList, setMaterialList] = useState<Material[]>(() => {
    const saved = localStorage.getItem("blcts-materials");
    return saved ? (JSON.parse(saved) as Material[]) : materials;
  });

  useEffect(() => {
    localStorage.setItem("blcts-vendors", JSON.stringify(vendorList));
  }, [vendorList]);
  useEffect(() => {
    localStorage.setItem("blcts-materials", JSON.stringify(materialList));
  }, [materialList]);

  // Vendors UI state
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorTypeFilter, setVendorTypeFilter] = useState<"All" | VendorType>("All");
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorDraft, setVendorDraft] = useState<Vendor>(emptyVendor());
  const [vendorEditMode, setVendorEditMode] = useState(false);

  // Materials UI state
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState("All");
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [materialDraft, setMaterialDraft] = useState<Material>(emptyMaterial());
  const [materialEditMode, setMaterialEditMode] = useState(false);

  const materialCategories = useMemo(() => {
    const set = new Set<string>();
    materialList.forEach((m) => set.add(m.category));
    return Array.from(set).sort();
  }, [materialList]);

  // ---- Derived data ----
  const filteredVendors = vendorList.filter((v) => {
    const q = vendorSearch.toLowerCase();
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.contactPerson.toLowerCase().includes(q);
    const matchesType = vendorTypeFilter === "All" || v.type === vendorTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredMaterials = materialList.filter((m) => {
    const q = materialSearch.toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.supplier.toLowerCase().includes(q) ||
      m.manufacturer.toLowerCase().includes(q);
    const matchesCategory = materialCategoryFilter === "All" || m.category === materialCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const summary = useMemo(() => {
    const total = vendorList.length;
    const activeContractors = vendorList.filter((v) => v.type === "Contractor").length;
    const avgRating =
      total > 0
        ? vendorList.reduce((s, v) => s + (v.performanceRating || 0), 0) / total
        : 0;
    const totalContractValue = vendorList.reduce((s, v) => s + (v.contractValue || 0), 0);
    return { total, activeContractors, avgRating, totalContractValue };
  }, [vendorList]);

  const performanceChartData = useMemo(
    () =>
      vendorList
        .map((v) => ({ name: v.name, rating: v.performanceRating, type: v.type }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10),
    [vendorList]
  );

  // ---- Vendor handlers ----
  const openAddVendor = () => {
    setVendorEditMode(false);
    setVendorDraft(emptyVendor());
    setVendorModalOpen(true);
  };
  const openEditVendor = (v: Vendor) => {
    setVendorEditMode(true);
    setVendorDraft({ ...v });
    setVendorModalOpen(true);
  };
  const saveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorDraft.name || !vendorDraft.contactPerson || !vendorDraft.email) {
      triggerToast("Name, contact person and email are required", "warning");
      return;
    }
    if (vendorEditMode) {
      setVendorList((prev) => prev.map((v) => (v.id === vendorDraft.id ? vendorDraft : v)));
      triggerToast(`Updated vendor: ${vendorDraft.name}`, "success");
    } else {
      setVendorList((prev) => [vendorDraft, ...prev]);
      triggerToast(`Added vendor: ${vendorDraft.name}`, "success");
    }
    setVendorModalOpen(false);
  };
  const deleteVendor = (v: Vendor) => {
    if (window.confirm(`Remove "${v.name}" from the vendor directory?`)) {
      setVendorList((prev) => prev.filter((x) => x.id !== v.id));
      triggerToast(`Removed vendor: ${v.name}`, "success");
    }
  };

  // ---- Material handlers ----
  const openAddMaterial = () => {
    setMaterialEditMode(false);
    setMaterialDraft(emptyMaterial());
    setMaterialModalOpen(true);
  };
  const openEditMaterial = (m: Material) => {
    setMaterialEditMode(true);
    setMaterialDraft({ ...m });
    setMaterialModalOpen(true);
  };
  const saveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialDraft.name || !materialDraft.supplier || !materialDraft.unit) {
      triggerToast("Name, supplier and unit are required", "warning");
      return;
    }
    if (materialDraft.currentPrice <= 0) {
      triggerToast("Current price must be greater than 0", "warning");
      return;
    }
    const today = new Date().toISOString().substring(0, 10);
    if (materialEditMode) {
      const updated: Material = {
        ...materialDraft,
        historicalPrices: [
          ...materialDraft.historicalPrices,
          { date: today, price: materialDraft.currentPrice },
        ].slice(-24),
      };
      setMaterialList((prev) => prev.map((m) => (m.id === materialDraft.id ? updated : m)));
      triggerToast(`Updated material: ${materialDraft.name}`, "success");
    } else {
      const created: Material = {
        ...materialDraft,
        historicalPrices: [{ date: today, price: materialDraft.currentPrice }],
      };
      setMaterialList((prev) => [created, ...prev]);
      triggerToast(`Added material: ${materialDraft.name}`, "success");
    }
    setMaterialModalOpen(false);
  };
  const deleteMaterial = (m: Material) => {
    if (window.confirm(`Remove "${m.name}" from the materials database?`)) {
      setMaterialList((prev) => prev.filter((x) => x.id !== m.id));
      triggerToast(`Removed material: ${m.name}`, "success");
    }
  };

  
  // ---- Render helpers ----
  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = i < full;
          const isHalf = i === full && half;
          return (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                filled
                  ? "text-amber-400 fill-amber-400"
                  : isHalf
                  ? "text-amber-400 fill-amber-400/50"
                  : "text-slate-300 dark:text-slate-600"
              }`}
            />
          );
        })}
        <span className="ml-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const renderPerformanceBar = (rate: number) => {
    const pct = Math.max(0, Math.min(100, rate));
    const color = pct >= 90 ? "bg-emerald-500" : pct >= 75 ? "bg-blue-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">{pct.toFixed(0)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Vendor & Materials Center
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage vendor relationships, contracts, performance, and the materials cost database.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mt-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-full sm:w-auto sm:inline-flex">
          <button
            onClick={() => setActiveTab("vendors")}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "vendors"
                ? "bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Vendors
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "materials"
                ? "bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Materials Database
          </button>
        </div>
      </div>

      {/* ===================== VENDORS TAB ===================== */}
      {activeTab === "vendors" && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Users className="w-5 h-5" />}
              label="Total Vendors"
              value={summary.total.toString()}
              accent="emerald"
            />
            <SummaryCard
              icon={<Briefcase className="w-5 h-5" />}
              label="Active Contractors"
              value={summary.activeContractors.toString()}
              accent="amber"
            />
            <SummaryCard
              icon={<Award className="w-5 h-5" />}
              label="Avg. Performance"
              value={`${summary.avgRating.toFixed(1)} / 5`}
              accent="blue"
            />
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Total Contract Value"
              value={formatKSh(summary.totalContractValue)}
              accent="emerald"
            />
          </div>

          {/* Performance chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.03)]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5 mb-4">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Vendor Performance Comparison
            </h3>
            <div className="h-64">
              {performanceChartData.length === 0 ? (
                <EmptyState message="No vendor data to chart yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip
                      formatter={(v: any) => [`${Number(v).toFixed(1)} / 5`, "Rating"]}
                      contentStyle={{
                        fontSize: "11px",
                        borderRadius: "8px",
                        background: "#1e293b",
                        border: "1px solid #334155",
                        color: "#f1f5f9",
                      }}
                    />
                    <Bar dataKey="rating" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {performanceChartData.map((entry, i) => (
                        <Cell key={i} fill={TYPE_STYLES[entry.type as VendorType]?.chart ?? "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Search + filter + add */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.03)] space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                Vendor Directory
              </h3>
              <button
                onClick={openAddVendor}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Vendor
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name, category or contact..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs font-medium placeholder-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap hidden md:inline">
                  Type:
                </span>
                <select
                  value={vendorTypeFilter}
                  onChange={(e) => setVendorTypeFilter(e.target.value as "All" | VendorType)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto"
                >
                  <option value="All">All Types</option>
                  {VENDOR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vendor cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredVendors.map((v) => {
                const style = TYPE_STYLES[v.type];
                const expanded = expandedVendor === v.id;
                return (
                  <div
                    key={v.id}
                    className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-300"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-950 text-emerald-400 font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0 select-none">
                          {v.name.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{v.name}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${style.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {v.type}
                            </span>
                            {v.complianceCertified && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
                                <ShieldCheck className="w-3 h-3" />
                                Compliant
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditVendor(v)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Edit vendor"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteVendor(v)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Category + contact */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Tag className="w-3 h-3" />
                        <span className="font-medium">{v.category || "Uncategorized"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Users className="w-3 h-3" />
                        <span className="font-medium">{v.contactPerson || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Mail className="w-3 h-3" />
                        <span className="font-medium truncate">{v.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Phone className="w-3 h-3" />
                        <span className="font-medium">{v.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span className="font-medium">{v.address || "—"}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Contract Value</div>
                        <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">{formatKSh(v.contractValue)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Expiry</div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(v.contractExpiry)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Performance</div>
                        {renderStars(v.performanceRating)}
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">On-Time Delivery</div>
                        {renderPerformanceBar(v.deliveryOnTimeRate)}
                      </div>
                      <div className="col-span-2">
                        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Payment Terms</div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{v.paymentTerms || "—"}</div>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedVendor(expanded ? null : v.id)}
                      className="mt-4 w-full flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {expanded ? (
                        <>
                          Hide history <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Show delivery & payment history <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    {expanded && (
                      <div className="mt-3 space-y-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                        {/* Delivery history */}
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            Delivery History
                          </div>
                          {v.deliveryHistory.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">No delivery records.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {v.deliveryHistory.map((d, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-900 rounded-lg px-2.5 py-1.5 border border-slate-100 dark:border-slate-800"
                                >
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">{d.item}</div>
                                    <div className="text-slate-400">{formatDate(d.date)}</div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{formatKSh(d.value)}</span>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                        d.status === "On-Time"
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                          : d.status === "Late"
                                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                      }`}
                                    >
                                      {d.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Payment history */}
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            Payment History
                          </div>
                          {v.paymentHistory.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">No payment records.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {v.paymentHistory.map((p, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-900 rounded-lg px-2.5 py-1.5 border border-slate-100 dark:border-slate-800"
                                >
                                  <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{formatKSh(p.amount)}</div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">{formatDate(p.date)}</span>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                        p.status === "Paid"
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                          : p.status === "Pending"
                                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                      }`}
                                    >
                                      {p.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredVendors.length === 0 && (
                <div className="lg:col-span-2">
                  <EmptyState message="No vendors match your search. Add a new vendor to get started." />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MATERIALS TAB ===================== */}
      {activeTab === "materials" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                Materials Cost Database
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Track material prices, lead times, availability and carbon footprint with historical trends.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openAddMaterial}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Material
              </button>
            </div>
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search material, supplier or manufacturer..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs font-medium placeholder-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap hidden md:inline">
                Category:
              </span>
              <select
                value={materialCategoryFilter}
                onChange={(e) => setMaterialCategoryFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold py-2 px-3 rounded-xl text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto"
              >
                <option value="All">All Categories</option>
                {materialCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Material cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMaterials.map((m) => (
              <div
                key={m.id}
                className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-0.5">
                        <Tag className="w-2.5 h-2.5" />
                        {m.category || "Uncategorized"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditMaterial(m)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Edit material"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMaterial(m)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Supplier / manufacturer */}
                <div className="mt-3 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Truck className="w-3 h-3" />
                    <span className="font-medium">{m.supplier || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Building2 className="w-3 h-3" />
                    <span className="font-medium">{m.manufacturer || "—"}</span>
                  </div>
                </div>

                {/* Price + unit */}
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Current Price</div>
                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{formatKSh(m.currentPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Unit</div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{m.unit || "—"}</div>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="mt-3 h-12">
                  {m.historicalPrices.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={m.historicalPrices} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Tooltip
                          formatter={(v: any) => [formatKSh(Number(v)), "Price"]}
                          contentStyle={{
                            fontSize: "10px",
                            borderRadius: "6px",
                            background: "#1e293b",
                            border: "1px solid #334155",
                            color: "#f1f5f9",
                          }}
                          labelFormatter={(l) => formatDate(String(l))}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-slate-400 italic">
                      Insufficient history for trend
                    </div>
                  )}
                </div>

                {/* Footer metrics */}
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Lead
                    </div>
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{m.leadTimeDays}d</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Leaf className="w-2.5 h-2.5" /> Carbon
                    </div>
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{m.carbonFootprint} kg</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Avail.</div>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${AVAILABILITY_STYLES[m.availability]}`}>
                      {m.availability}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredMaterials.length === 0 && (
              <div className="md:col-span-2 xl:col-span-3">
                <EmptyState message="No materials match your search. Add a new material to get started." />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== VENDOR MODAL ===================== */}
      {vendorModalOpen && (
        <Modal onClose={() => setVendorModalOpen(false)} title={vendorEditMode ? "Edit Vendor" : "Add Vendor"}>
          <form onSubmit={saveVendor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Vendor Name *">
              <input
                type="text"
                required
                value={vendorDraft.name}
                onChange={(e) => setVendorDraft({ ...vendorDraft, name: e.target.value })}
                className={inputCls}
                placeholder="e.g. Bamburi Special Concrete"
              />
            </Field>
            <Field label="Type">
              <select
                value={vendorDraft.type}
                onChange={(e) => setVendorDraft({ ...vendorDraft, type: e.target.value as VendorType })}
                className={inputCls}
              >
                {VENDOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <input
                type="text"
                value={vendorDraft.category}
                onChange={(e) => setVendorDraft({ ...vendorDraft, category: e.target.value })}
                className={inputCls}
                placeholder="e.g. Concrete & Cement"
              />
            </Field>
            <Field label="Contact Person *">
              <input
                type="text"
                required
                value={vendorDraft.contactPerson}
                onChange={(e) => setVendorDraft({ ...vendorDraft, contactPerson: e.target.value })}
                className={inputCls}
                placeholder="e.g. Jane Doe"
              />
            </Field>
            <Field label="Email *">
              <input
                type="email"
                required
                value={vendorDraft.email}
                onChange={(e) => setVendorDraft({ ...vendorDraft, email: e.target.value })}
                className={inputCls}
                placeholder="vendor@example.com"
              />
            </Field>
            <Field label="Phone">
              <input
                type="text"
                value={vendorDraft.phone}
                onChange={(e) => setVendorDraft({ ...vendorDraft, phone: e.target.value })}
                className={inputCls}
                placeholder="+254 700 000 000"
              />
            </Field>
            <Field label="Address" full>
              <input
                type="text"
                value={vendorDraft.address}
                onChange={(e) => setVendorDraft({ ...vendorDraft, address: e.target.value })}
                className={inputCls}
                placeholder="Street, City"
              />
            </Field>
            <Field label="Contract Value (KSh)">
              <input
                type="number"
                min={0}
                value={vendorDraft.contractValue || ""}
                onChange={(e) => setVendorDraft({ ...vendorDraft, contractValue: Number(e.target.value) || 0 })}
                className={inputCls}
                placeholder="0"
              />
            </Field>
            <Field label="Contract Expiry">
              <input
                type="date"
                value={vendorDraft.contractExpiry}
                onChange={(e) => setVendorDraft({ ...vendorDraft, contractExpiry: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Performance Rating (0–5)">
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={vendorDraft.performanceRating || ""}
                onChange={(e) => setVendorDraft({ ...vendorDraft, performanceRating: Number(e.target.value) || 0 })}
                className={inputCls}
                placeholder="4.5"
              />
            </Field>
            <Field label="On-Time Delivery Rate (%)">
              <input
                type="number"
                min={0}
                max={100}
                value={vendorDraft.deliveryOnTimeRate || ""}
                onChange={(e) => setVendorDraft({ ...vendorDraft, deliveryOnTimeRate: Number(e.target.value) || 0 })}
                className={inputCls}
                placeholder="95"
              />
            </Field>
            <Field label="Payment Terms">
              <input
                type="text"
                value={vendorDraft.paymentTerms}
                onChange={(e) => setVendorDraft({ ...vendorDraft, paymentTerms: e.target.value })}
                className={inputCls}
                placeholder="Net 30"
              />
            </Field>
            <Field label="Compliance Expiry">
              <input
                type="date"
                value={vendorDraft.complianceExpiry}
                onChange={(e) => setVendorDraft({ ...vendorDraft, complianceExpiry: e.target.value })}
                className={inputCls}
              />
            </Field>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="complianceCertified"
                checked={vendorDraft.complianceCertified}
                onChange={(e) => setVendorDraft({ ...vendorDraft, complianceCertified: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="complianceCertified" className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                Compliance Certified
              </label>
            </div>

            <ModalActions onCancel={() => setVendorModalOpen(false)} label={vendorEditMode ? "Save Changes" : "Add Vendor"} />
          </form>
        </Modal>
      )}

      {/* ===================== MATERIAL MODAL ===================== */}
      {materialModalOpen && (
        <Modal onClose={() => setMaterialModalOpen(false)} title={materialEditMode ? "Edit Material" : "Add Material"}>
          <form onSubmit={saveMaterial} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Material Name *" full>
              <input
                type="text"
                required
                value={materialDraft.name}
                onChange={(e) => setMaterialDraft({ ...materialDraft, name: e.target.value })}
                className={inputCls}
                placeholder="e.g. Bamburi CEM II Cement"
              />
            </Field>
            <Field label="Category">
              <input
                type="text"
                value={materialDraft.category}
                onChange={(e) => setMaterialDraft({ ...materialDraft, category: e.target.value })}
                className={inputCls}
                placeholder="e.g. Concrete & Cement"
              />
            </Field>
            <Field label="Supplier *">
              <input
                type="text"
                required
                value={materialDraft.supplier}
                onChange={(e) => setMaterialDraft({ ...materialDraft, supplier: e.target.value })}
                className={inputCls}
                placeholder="e.g. Bamburi Special Concrete"
              />
            </Field>
            <Field label="Manufacturer">
              <input
                type="text"
                value={materialDraft.manufacturer}
                onChange={(e) => setMaterialDraft({ ...materialDraft, manufacturer: e.target.value })}
                className={inputCls}
                placeholder="e.g. Bamburi Cement Ltd"
              />
            </Field>
            <Field label="Unit *">
              <input
                type="text"
                required
                value={materialDraft.unit}
                onChange={(e) => setMaterialDraft({ ...materialDraft, unit: e.target.value })}
                className={inputCls}
                placeholder="e.g. 50Kg Bag"
              />
            </Field>
            <Field label="Current Price (KSh) *">
              <input
                type="number"
                required
                min={0}
                value={materialDraft.currentPrice || ""}
                onChange={(e) => setMaterialDraft({ ...materialDraft, currentPrice: Number(e.target.value) || 0 })}
                className={inputCls}
                placeholder="0"
              />
            </Field>
            <Field label="Lead Time (days)">
              <input
                type="number"
                min={0}
                value={materialDraft.leadTimeDays || ""}
                onChange={(e) => setMaterialDraft({ ...materialDraft, leadTimeDays: Number(e.target.value) || 0 })}
                className={inputCls}
                placeholder="7"
              />
            </Field>
            <Field label="Availability">
              <select
                value={materialDraft.availability}
                onChange={(e) => setMaterialDraft({ ...materialDraft, availability: e.target.value as Material["availability"] })}
                className={inputCls}
              >
                {(["In Stock", "Low Stock", "Out of Stock", "Pre-Order"] as const).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Carbon Footprint (kg CO₂e)">
              <input
                type="number"
                min={0}
                value={materialDraft.carbonFootprint || ""}
                onChange={(e) => setMaterialDraft({ ...materialDraft, carbonFootprint: Number(e.target.value) || 0 })}
                className={inputCls}
                placeholder="0"
              />
            </Field>

            <ModalActions onCancel={() => setMaterialModalOpen(false)} label={materialEditMode ? "Save Changes" : "Add Material"} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Shared presentational components ---------------- */

const inputCls =
  "w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500";

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "emerald" | "amber" | "blue";
}) {
  const accents: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.03)] flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accents[accent]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{label}</div>
        <div className="text-lg font-black text-slate-900 dark:text-white truncate">{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 text-center text-slate-400 dark:text-slate-500 font-light leading-relaxed">
      <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
      <p className="text-xs">{message}</p>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onCancel, label }: { onCancel: () => void; label: string }) {
  return (
    <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer transition-colors"
      >
        {label}
      </button>
    </div>
  );
}
