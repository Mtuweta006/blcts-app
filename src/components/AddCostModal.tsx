import React, { useState, useMemo } from "react";
import { Coins, X, TriangleAlert as AlertTriangle, Search, ChevronRight } from "lucide-react";
import { LifecyclePhase } from "../types";

interface AddCostModalProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  newEntry: {
    phase: LifecyclePhase;
    component: string;
    amount: string;
    contractor: string;
    date: string;
    description: string;
  };
  setNewEntry: React.Dispatch<React.SetStateAction<{
    phase: LifecyclePhase;
    component: string;
    amount: string;
    contractor: string;
    date: string;
    description: string;
  }>>;
  handleAddSubmit: (e: React.FormEvent) => void;
  formError: string;
}

interface ComponentPreset {
  category: string;
  label: string;
  value: string;
  defaultContractor: string;
  phase: LifecyclePhase;
  suggestedAmount: string;
}

const PRESETS: ComponentPreset[] = [
  { category: "Mechanical", label: "HVAC Compressor Replacement", value: "Mechanical > HVAC > Compressor Replacement", defaultContractor: "Davis & Shirtliff", phase: "Maintenance", suggestedAmount: "280000" },
  { category: "Mechanical", label: "Otis Lift Rotors Alignment", value: "Mechanical > Otis Lift > Rotors Alignment", defaultContractor: "Otis Elevators Kenya", phase: "Maintenance", suggestedAmount: "350000" },
  { category: "Electrical", label: "Solar Battery Inverters Grid", value: "Electrical > Solar Power Grid > Battery Inverters", defaultContractor: "Sollatek East Africa", phase: "Construction", suggestedAmount: "1200000" },
  { category: "Electrical", label: "KPLC Power Utilities Bill", value: "Electrical > Power Grid Mains Supply", defaultContractor: "Kenya Power (KPLC)", phase: "Operational", suggestedAmount: "120000" },
  { category: "Plumbing", label: "Mains Booster Water Pump", value: "Plumbing > Water Pumps > Borehole Filtration", defaultContractor: "Nairobi Water (NCWSC)", phase: "Maintenance", suggestedAmount: "180000" },
  { category: "Structural", label: "Concrete Foundation Waterproofing", value: "Structural > Foundations > Concrete Waterproofing", defaultContractor: "Bamburi Special Products", phase: "Construction", suggestedAmount: "2100000" },
  { category: "Structural", label: "Economy Corrugated Roofing Sheets", value: "Structural > Roofing > Economy Corrugated Sheets", defaultContractor: "Devki Steel Kenya", phase: "Maintenance", suggestedAmount: "850000" }
];

export default function AddCostModal({
  isAddModalOpen,
  setIsAddModalOpen,
  newEntry,
  setNewEntry,
  handleAddSubmit,
  formError
}: AddCostModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPresets, setShowPresets] = useState(false);

  if (!isAddModalOpen) return null;

  const filteredPresets = PRESETS.filter(p =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const applyPreset = (preset: ComponentPreset) => {
    setNewEntry(prev => ({
      ...prev,
      component: preset.value,
      contractor: preset.defaultContractor,
      phase: preset.phase,
      amount: preset.suggestedAmount
    }));
    setSearchQuery(preset.value);
    setShowPresets(false);
  };

  const handleComponentChange = (val: string) => {
    setNewEntry(prev => ({ ...prev, component: val }));
    setSearchQuery(val);
    setShowPresets(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop layer */}
      <div
        onClick={() => setIsAddModalOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-default"
      />
      {/* Content panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-lg relative z-10 overflow-hidden animate-zoom-in">
        {/* Modal Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-900">
          <div className="flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider font-display leading-tight">Record Lifecycle Invoice</h3>
              <p className="text-[10px] text-slate-500 leading-tight">Log construction outlays or utility bills dynamically</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal form body */}
        <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Lifecycle Phase Segment-Picker */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest font-display">
              Lifecycle Phase *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
              {(["Construction", "Operational", "Maintenance", "End-of-Life"] as LifecyclePhase[]).map(phaseVal => (
                <button
                  key={phaseVal}
                  type="button"
                  onClick={() => setNewEntry(prev => ({ ...prev, phase: phaseVal }))}
                  className={`py-2 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                    newEntry.phase === phaseVal
                      ? "bg-slate-950 text-white dark:bg-slate-800 dark:text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent"
                  }`}
                >
                  {phaseVal === "Construction" ? "Construction (CAPEX)" : phaseVal === "Operational" ? "Operational" : phaseVal === "Maintenance" ? "Maintenance" : "End-of-Life"}
                </button>
              ))}
            </div>
          </div>

          {/* Searchable Component Tree */}
          <div className="space-y-1.5 relative">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest font-display">
              System Component / Purpose *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Type system category or select with autocomplete..."
                value={newEntry.component}
                onChange={e => handleComponentChange(e.target.value)}
                onFocus={() => setShowPresets(true)}
                className="w-full bg-slate-50 dark:bg-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 caret-slate-900 dark:caret-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Presets Autocomplete Dropdown */}
            {showPresets && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20 p-2 space-y-1">
                <div className="flex justify-between items-center px-2 py-1 text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-900 pb-1.5">
                  <span>Classified Building Systems</span>
                  <button type="button" onClick={() => setShowPresets(false)} className="text-slate-400 hover:text-[#f43f5e] font-sans font-normal text-[10px]">Close Presets</button>
                </div>
                {filteredPresets.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic p-2 text-center">No classified asset tags. Type customized tags manually...</p>
                ) : (
                  filteredPresets.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/60 block transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 font-display">
                          {p.category}
                        </span>
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                          {p.phase}
                        </span>
                      </div>
                      <div className="text-xs text-slate-900 dark:text-slate-100 font-mono font-medium truncate mt-0.5">
                        {p.label}
                      </div>
                      <div className="text-[9.5px] text-slate-500 dark:text-slate-500 flex items-center justify-between mt-0.5">
                        <span>Contractor: {p.defaultContractor}</span>
                        <span>Est: KSh {p.suggestedAmount}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Grid of details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount inside KSh */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest font-display">
                Amount (KSh) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 450,000"
                value={newEntry.amount}
                onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 caret-slate-900 dark:caret-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Contracting Vendor */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest font-display">
                Contractor / Supplier *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kenya Power, Davis & Shirtliff"
                value={newEntry.contractor}
                onChange={e => setNewEntry({ ...newEntry, contractor: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 caret-slate-900 dark:caret-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
              />
            </div>
          </div>

          {/* Date selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest font-display">
              Date Registered *
            </label>
            <input
              type="date"
              required
              value={newEntry.date}
              onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 caret-slate-900 dark:caret-slate-100"
            />
          </div>

          {/* Memo Description */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest font-display">
              Memo Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Record material qualities, thickness indicators, or efficiency metrics here..."
              value={newEntry.description}
              onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 caret-slate-900 dark:caret-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-light"
            />
          </div>

          {/* Actions row footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 px-4 rounded-xl focus:outline-none transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-slate-950 hover:bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md focus:outline-none transition-colors cursor-pointer"
            >
              Register Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
