import React, { useState, useEffect, useMemo } from "react";
import { Wrench, Plus, Search, ListFilter as Filter, X, Calendar, Clock, DollarSign, Building2, Zap, Flame, Droplets, Shield, Sun, Wind, TriangleAlert as AlertTriangle, ArrowUpDown, Package, TrendingUp } from "lucide-react";
import { Asset } from "../types";

interface AssetManagementProps {
  assets: Asset[];
  selectedPropertyId: string;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
}

const ASSET_CATEGORIES: Asset["category"][] = [
  "HVAC Systems",
  "Elevators",
  "Solar Installations",
  "Water Systems",
  "Electrical Infrastructure",
  "Security Systems",
  "Generators",
  "Fire Safety Equipment",
  "Plumbing",
  "Roofing",
  "Structural Components",
];

const MAINTENANCE_SCHEDULES: Asset["maintenanceSchedule"][] = [
  "Monthly",
  "Quarterly",
  "Bi-Annually",
  "Annually",
];

const CONDITIONS: Asset["currentCondition"][] = [
  "New",
  "Good",
  "Fair",
  "Poor",
  "Critical",
];

const STORAGE_KEY = "blcts-assets";

// Map each category to a lucide icon
const CATEGORY_ICONS: Record<Asset["category"], React.ElementType> = {
  "HVAC Systems": Wind,
  Elevators: ArrowUpDown,
  "Solar Installations": Sun,
  "Water Systems": Droplets,
  "Electrical Infrastructure": Zap,
  "Security Systems": Shield,
  Generators: Flame,
  "Fire Safety Equipment": AlertTriangle,
  Plumbing: Wrench,
  Roofing: Building2,
  "Structural Components": Package,
};

const CONDITION_STYLES: Record<
  Asset["currentCondition"],
  { badge: string; dot: string }
> = {
  New: {
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
  },
  Good: {
    badge:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
    dot: "bg-blue-500",
  },
  Fair: {
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  Poor: {
    badge:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-500",
  },
  Critical: {
    badge:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-600",
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

// Calculate remaining useful life in years from installation date + expected lifespan
const calculateRemainingLife = (
  installationDate: string,
  expectedLifespan: number
): number => {
  const installed = new Date(installationDate);
  if (isNaN(installed.getTime())) return expectedLifespan;
  const now = new Date();
  const elapsedYears =
    (now.getTime() - installed.getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);
  const remaining = expectedLifespan - elapsedYears;
  return Math.max(0, Math.round(remaining * 10) / 10);
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

type SortKey =
  | "name"
  | "replacementCost"
  | "remainingUsefulLife"
  | "currentCondition";

const CONDITION_RANK: Record<Asset["currentCondition"], number> = {
  New: 5,
  Good: 4,
  Fair: 3,
  Poor: 2,
  Critical: 1,
};

const emptyForm = {
  name: "",
  category: ASSET_CATEGORIES[0] as Asset["category"],
  installationDate: "",
  expectedLifespan: 10,
  warrantyInfo: "",
  vendor: "",
  maintenanceSchedule: "Quarterly" as Asset["maintenanceSchedule"],
  currentCondition: "Good" as Asset["currentCondition"],
  replacementCost: 0,
};

export default function AssetManagement({
  assets,
  selectedPropertyId,
  triggerToast,
}: AssetManagementProps) {
  const [localAssets, setLocalAssets] = useState<Asset[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [newAsset, setNewAsset] = useState({ ...emptyForm });

  // Load persisted assets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Asset[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLocalAssets(parsed);
        }
      }
    } catch (err) {
          }
  }, []);

  // Persist local assets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localAssets));
    } catch (err) {
          }
  }, [localAssets]);

  // Merge prop assets with locally-persisted assets (props take precedence by id)
  const allAssets = useMemo(() => {
    const propIds = new Set(assets.map((a) => a.id));
    const merged = [...assets];
    for (const la of localAssets) {
      if (!propIds.has(la.id)) merged.push(la);
    }
    return merged;
  }, [assets, localAssets]);

  // Filter by selected property
  const propertyAssets = useMemo(
    () => allAssets.filter((a) => a.propertyId === selectedPropertyId),
    [allAssets, selectedPropertyId]
  );

  // Apply search + category filter + sort
  const visibleAssets = useMemo(() => {
    let list = propertyAssets;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.vendor.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "All") {
      list = list.filter((a) => a.category === categoryFilter);
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "replacementCost":
          return b.replacementCost - a.replacementCost;
        case "remainingUsefulLife": {
          const ra =
            a.remainingUsefulLife ??
            calculateRemainingLife(a.installationDate, a.expectedLifespan);
          const rb =
            b.remainingUsefulLife ??
            calculateRemainingLife(b.installationDate, b.expectedLifespan);
          return rb - ra;
        }
        case "currentCondition":
          return CONDITION_RANK[b.currentCondition] - CONDITION_RANK[a.currentCondition];
        default:
          return 0;
      }
    });

    return sorted;
  }, [propertyAssets, searchQuery, categoryFilter, sortKey]);

  // Summary metrics
  const summary = useMemo(() => {
    const total = propertyAssets.length;
    const totalReplacementValue = propertyAssets.reduce(
      (sum, a) => sum + (a.replacementCost || 0),
      0
    );
    const conditionScores = propertyAssets.map(
      (a) => CONDITION_RANK[a.currentCondition]
    );
    const avgConditionScore =
      total > 0
        ? conditionScores.reduce((s, v) => s + v, 0) / total
        : 0;
    // Map average score back to a label
    let avgConditionLabel = "—";
    if (total > 0) {
      if (avgConditionScore >= 4.5) avgConditionLabel = "New";
      else if (avgConditionScore >= 3.5) avgConditionLabel = "Good";
      else if (avgConditionScore >= 2.5) avgConditionLabel = "Fair";
      else if (avgConditionScore >= 1.5) avgConditionLabel = "Poor";
      else avgConditionLabel = "Critical";
    }
    return { total, totalReplacementValue, avgConditionLabel };
  }, [propertyAssets]);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAsset.name.trim()) {
      triggerToast("Please provide an asset name.", "warning");
      return;
    }
    if (!newAsset.installationDate) {
      triggerToast("Please select an installation date.", "warning");
      return;
    }
    if (!newAsset.vendor.trim()) {
      triggerToast("Please specify a vendor for this asset.", "warning");
      return;
    }
    if (newAsset.replacementCost <= 0) {
      triggerToast("Replacement cost must be greater than zero.", "warning");
      return;
    }

    const created: Asset = {
      id: `asset-${Date.now()}`,
      propertyId: selectedPropertyId,
      name: newAsset.name.trim(),
      category: newAsset.category,
      installationDate: newAsset.installationDate,
      expectedLifespan: Number(newAsset.expectedLifespan) || 1,
      warrantyInfo: newAsset.warrantyInfo.trim() || "No warranty on record",
      vendor: newAsset.vendor.trim(),
      maintenanceSchedule: newAsset.maintenanceSchedule,
      currentCondition: newAsset.currentCondition,
      replacementCost: Number(newAsset.replacementCost) || 0,
      remainingUsefulLife: calculateRemainingLife(
        newAsset.installationDate,
        Number(newAsset.expectedLifespan) || 1
      ),
      maintenanceHistory: [],
    };

    setLocalAssets((prev) => [...prev, created]);
    setIsAddModalOpen(false);
    setNewAsset({ ...emptyForm });
    triggerToast(`Asset "${created.name}" added successfully.`, "success");
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setNewAsset({ ...emptyForm });
  };

  return (
    <div className="space-y-8 text-left animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Asset Register
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track building assets, conditions, warranties, and replacement
            lifecycle costs across the property portfolio.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* SUMMARY BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                Total Assets
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
                Total Replacement Value
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatKSh(summary.totalReplacementValue)}
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
                Average Condition
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {summary.avgConditionLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR: search + filter + sort */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by asset name, category, or vendor..."
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
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="name">Sort: Name</option>
            <option value="replacementCost">Sort: Replacement Cost</option>
            <option value="remainingUsefulLife">Sort: Remaining Life</option>
            <option value="currentCondition">Sort: Condition</option>
          </select>
        </div>
      </div>

      {/* ASSET GRID */}
      {visibleAssets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Wrench className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No assets found
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-light">
            {propertyAssets.length === 0
              ? "This property has no registered assets yet. Click \"Add Asset\" to begin tracking."
              : "No assets match your current search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleAssets.map((asset) => {
            const Icon = CATEGORY_ICONS[asset.category] || Package;
            const cond = CONDITION_STYLES[asset.currentCondition];
            const remaining =
              asset.remainingUsefulLife ??
              calculateRemainingLife(
                asset.installationDate,
                asset.expectedLifespan
              );
            const lifePercent = Math.min(
              100,
              Math.max(
                0,
                (remaining / Math.max(1, asset.expectedLifespan)) * 100
              )
            );
            const lifeBarColor =
              lifePercent > 50
                ? "bg-emerald-500"
                : lifePercent > 20
                ? "bg-amber-500"
                : "bg-rose-500";

            return (
              <div
                key={asset.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)] space-y-4 flex flex-col"
              >
                {/* Header row: icon + name + condition badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {asset.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold block truncate">
                        {asset.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border shrink-0 ${cond.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cond.dot}`} />
                    {asset.currentCondition}
                  </span>
                </div>

                {/* Installation + lifespan */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Installed
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {formatDate(asset.installationDate)}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expected Life
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {asset.expectedLifespan} yrs
                    </span>
                  </div>
                </div>

                {/* Remaining useful life bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 dark:text-slate-500 uppercase font-semibold">
                      Remaining Useful Life
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                      {remaining.toFixed(1)} yrs
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${lifeBarColor} transition-all duration-500`}
                      style={{ width: `${lifePercent}%` }}
                    />
                  </div>
                </div>

                {/* Replacement cost + vendor */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Replacement
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono block">
                      {formatKShFull(asset.replacementCost)}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                      Vendor
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {asset.vendor}
                    </span>
                  </div>
                </div>

                {/* Maintenance + warranty */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> Maintenance
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {asset.maintenanceSchedule}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Warranty
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {asset.warrantyInfo}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD ASSET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Register New Asset
              </h3>
              <button
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Asset Name
                </label>
                <input
                  type="text"
                  required
                  value={newAsset.name}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, name: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Rooftop Chiller Unit A1"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={newAsset.category}
                  onChange={(e) =>
                    setNewAsset({
                      ...newAsset,
                      category: e.target.value as Asset["category"],
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {ASSET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Installation date + expected lifespan */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Installation Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newAsset.installationDate}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        installationDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Expected Lifespan (yrs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newAsset.expectedLifespan}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        expectedLifespan: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Warranty + vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Warranty Info
                  </label>
                  <input
                    type="text"
                    value={newAsset.warrantyInfo}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        warrantyInfo: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 2-year parts & labour"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Vendor
                  </label>
                  <input
                    type="text"
                    required
                    value={newAsset.vendor}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, vendor: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. CoolAir Kenya Ltd"
                  />
                </div>
              </div>

              {/* Maintenance schedule + condition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Maintenance Schedule
                  </label>
                  <select
                    value={newAsset.maintenanceSchedule}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        maintenanceSchedule: e.target
                          .value as Asset["maintenanceSchedule"],
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {MAINTENANCE_SCHEDULES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Current Condition
                  </label>
                  <select
                    value={newAsset.currentCondition}
                    onChange={(e) =>
                      setNewAsset({
                        ...newAsset,
                        currentCondition: e.target
                          .value as Asset["currentCondition"],
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Replacement cost */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Replacement Cost (KSh)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newAsset.replacementCost}
                  onChange={(e) =>
                    setNewAsset({
                      ...newAsset,
                      replacementCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-600"
                  placeholder="e.g. 4500000"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer text-center"
              >
                Register Asset
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
