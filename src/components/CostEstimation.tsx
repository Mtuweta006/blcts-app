import React, { useState, useEffect, useMemo } from "react";
import { Cpu, Sparkles, Building2, Layers, RefreshCw, FileSliders as Sliders, Lightbulb, CircleCheck as CheckCircle2, Info, MapPin, ShieldCheck, Calculator, Wallet, Landmark, HardHat, FileText, TrendingUp } from "lucide-react";
import { Property } from "../types";
import { getAllCounties, getSafetyMarginFromStorage, calculateQSEstimate, formatKSh, getCostConfigFromStorage, setCostConfigToStorage, CostEstimateConfig, DEFAULT_CONFIG, QSEstimateResult } from "../utils/pricingEngine";
import { countyCities } from "../data/regionalPricing";
import { WorkflowStepper, NextStepGuide } from "./WorkflowComponents";

interface CostEstimationProps {
  selectedProperty: Property;
  triggerToast?: (msg: string, type?: "success" | "info" | "warning") => void;
}

type ConstructionStandard = "Economy" | "Standard" | "Premium" | "Luxury";

export default function CostEstimation({ selectedProperty, triggerToast }: CostEstimationProps) {
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<QSEstimateResult | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string>(selectedProperty?.county || "Nairobi");
  const [selectedCity, setSelectedCity] = useState<string>(selectedProperty?.city || "Nairobi CBD");
  const [useManualOverride, setUseManualOverride] = useState(false);
  const [manualArea, setManualArea] = useState<number>(selectedProperty?.estimatedFloorArea || 2500);
  const [manualFloors, setManualFloors] = useState<number>(selectedProperty?.floors || 4);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<CostEstimateConfig>(getCostConfigFromStorage());

  const safetyMargin = getSafetyMarginFromStorage();

  const loadingSteps = [
    "Validating project parameters...",
    "Querying regional material database...",
    "Applying regional pricing factors...",
    "Calculating labour and service costs...",
    "Applying safety margin and compiling estimate..."
  ];

  useEffect(() => {
    if (selectedProperty) {
      setManualArea(selectedProperty.estimatedFloorArea || 2500);
      setManualFloors(selectedProperty.floors || 4);
      setSelectedCounty(selectedProperty.county || "Nairobi");
      setSelectedCity(selectedProperty.city || "Nairobi CBD");
      generateEstimate();
    }
  }, [selectedProperty?.id]);

  useEffect(() => {
    if (selectedProperty && selectedCounty) generateEstimate();
  }, [selectedCounty, config.constructionStandard, config.lifecycleYears]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 700);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const generateEstimate = () => {
    setLoading(true);
    const area = useManualOverride ? manualArea : selectedProperty?.estimatedFloorArea || 2500;
    const floors = useManualOverride ? manualFloors : selectedProperty?.floors || 4;

    if (area <= 0 || floors < 1) {
      if (triggerToast) triggerToast("Invalid parameters: area must be greater than 0 and floors must be at least 1.", "warning");
      setLoading(false);
      return;
    }

    const buildingType = selectedProperty?.type || "Commercial";
    const annualOpex = selectedProperty?.opexBudget || 15000000;

    setTimeout(() => {
      const result = calculateQSEstimate(buildingType, floors, area, annualOpex, config, selectedCounty);
      setBreakdown(result);
      setLoading(false);
      if (triggerToast) {
        triggerToast(`QS estimate compiled for ${selectedCounty}. Construction standard: ${config.constructionStandard}.`, "success");
      }
    }, 400);
  };

  const handleRunEstimation = () => {
    if (useManualOverride) {
      if (manualArea <= 0) { triggerToast?.("Floor area must be greater than zero.", "warning"); return; }
      if (manualFloors < 1) { triggerToast?.("At least 1 floor required.", "warning"); return; }
    }
    generateEstimate();
  };

  const updateConfig = (newConfig: CostEstimateConfig) => {
    setConfig(newConfig);
    setCostConfigToStorage(newConfig);
  };

  const lastUpdatedDate = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 text-left space-y-6 animate-fade-in" id="ai-cost-estimation-page">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-500" />
            Construction Cost Estimation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-light">
            Quantity-surveying-based cost estimation using regional pricing, construction standards, professional fees, statutory costs, and contingency.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WorkflowStepper
            steps={[
              { label: "Project Details", status: "completed" },
              { label: "Drawings", status: "completed" },
              { label: "GFA", status: "completed" },
              { label: "Cost/m²", status: breakdown ? "completed" : "active" },
              { label: "Base Cost", status: breakdown ? "completed" : "pending" },
              { label: "Fees", status: breakdown ? "completed" : "pending" },
              { label: "Total", status: breakdown ? "completed" : "pending" },
              { label: "Lifecycle", status: breakdown ? "completed" : "pending" },
              { label: "AI", status: "pending" },
              { label: "Reports", status: "pending" },
            ]}
          />
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            Configure
          </button>
          <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Current Project</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-500" />
              {selectedProperty?.name || "No Project Loaded"}
            </span>
          </div>
        </div>
      </div>

      {/* CONFIG PANEL */}
      {showConfig && (
        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 space-y-4 animate-fade-in">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            Estimation Configuration
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Construction Standard</label>
              <select
                value={config.constructionStandard}
                onChange={e => updateConfig({ ...config, constructionStandard: e.target.value as ConstructionStandard })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
              >
                {["Economy", "Standard", "Premium", "Luxury"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Lifecycle (Years)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={config.lifecycleYears}
                onChange={e => updateConfig({ ...config, lifecycleYears: Math.max(1, Math.min(60, parseInt(e.target.value) || 30)) })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">VAT Rate (%)</label>
              <input
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={(config.vatRate * 100).toFixed(1)}
                onChange={e => updateConfig({ ...config, vatRate: Math.max(0, Math.min(0.30, parseFloat(e.target.value) / 100 || 0)) })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Contingency (%)</label>
              <input
                type="number"
                min={0}
                max={25}
                step={0.5}
                value={(config.contingencyRate * 100).toFixed(1)}
                onChange={e => updateConfig({ ...config, contingencyRate: Math.max(0, Math.min(0.25, parseFloat(e.target.value) / 100 || 0)) })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">External Works (%)</label>
              <input
                type="number"
                min={0}
                max={25}
                step={0.5}
                value={(config.externalWorksRate * 100).toFixed(1)}
                onChange={e => updateConfig({ ...config, externalWorksRate: Math.max(0, Math.min(0.25, parseFloat(e.target.value) / 100 || 0)) })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Preliminaries (%)</label>
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={(config.preliminariesRate * 100).toFixed(1)}
                onChange={e => updateConfig({ ...config, preliminariesRate: Math.max(0, Math.min(0.20, parseFloat(e.target.value) / 100 || 0)) })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Statutory Costs (%)</label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={(config.statutoryCostsRate * 100).toFixed(1)}
                onChange={e => updateConfig({ ...config, statutoryCostsRate: Math.max(0, Math.min(0.10, parseFloat(e.target.value) / 100 || 0)) })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Architect Fee (%)</label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={(config.professionalFees.architect * 100).toFixed(1)}
                onChange={e => updateConfig({ ...config, professionalFees: { ...config.professionalFees, architect: Math.max(0, Math.min(0.10, parseFloat(e.target.value) / 100 || 0)) } })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* PARAMETERS + OUTPUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT: Parameters */}
        <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 space-y-5">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-emerald-500" />
            Project Parameters
          </h4>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Manual Spec Override</span>
            <button
              onClick={() => setUseManualOverride(!useManualOverride)}
              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${useManualOverride ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-800"}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${useManualOverride ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">County (Location)</label>
              <select
                value={selectedCounty}
                onChange={e => {
                  setSelectedCounty(e.target.value);
                  const cities = countyCities[e.target.value] || [];
                  if (cities.length > 0) setSelectedCity(cities[0]);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
              >
                {getAllCounties().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">City/Town</label>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
              >
                {(countyCities[selectedCounty] || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Floor Area per Floor (SQM)</label>
              <input
                type="number"
                min={0}
                disabled={!useManualOverride}
                value={useManualOverride ? manualArea : selectedProperty?.estimatedFloorArea || 2500}
                onChange={e => setManualArea(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-900 font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Number of Floors</label>
              <input
                type="number"
                min={1}
                disabled={!useManualOverride}
                value={useManualOverride ? manualFloors : selectedProperty?.floors || 4}
                onChange={e => setManualFloors(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-900 font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Construction Standard</label>
              <select
                value={config.constructionStandard}
                onChange={e => updateConfig({ ...config, constructionStandard: e.target.value as ConstructionStandard })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
              >
                {["Economy", "Standard", "Premium", "Luxury"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Lifecycle Period (Years)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={config.lifecycleYears}
                onChange={e => updateConfig({ ...config, lifecycleYears: Math.max(1, Math.min(60, parseInt(e.target.value) || 30)) })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Safety Margin Active</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">KSh {safetyMargin} minimum per unit</span>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 font-light">Applied as percentage with KSh 20 floor</p>
            </div>
          </div>

          <button
            onClick={handleRunEstimation}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            <span>Generate Estimate</span>
          </button>
        </div>

        {/* RIGHT: Output */}
        <div className="lg:col-span-8 space-y-6">

          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-teal-500" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Quantity Surveying Estimate
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-500" />
              {selectedCounty} | {config.constructionStandard}
            </span>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{loadingSteps[loadingStep]}</p>
                <p className="text-[10px] text-slate-400 font-light max-w-xs leading-normal">
                  Calculating construction costs using regional pricing and QS standards...
                </p>
              </div>
              <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }} />
              </div>
            </div>
          ) : breakdown ? (
            <div className="space-y-6">

              {/* GFA SUMMARY */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Gross Floor Area</span>
                  <span className="font-mono font-black text-sm text-slate-800 dark:text-slate-200">{breakdown.gfa.toLocaleString()} m²</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Cost per m²</span>
                  <span className="font-mono font-black text-sm text-slate-800 dark:text-slate-200">{formatKSh(breakdown.costPerSqm)}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Standard</span>
                  <span className="font-mono font-black text-sm text-slate-800 dark:text-slate-200">{breakdown.config.constructionStandard}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Lifecycle</span>
                  <span className="font-mono font-black text-sm text-slate-800 dark:text-slate-200">{breakdown.lifecycleYears} years</span>
                </div>
              </div>

              {/* COST BREAKDOWN TABLE */}
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3 px-4">Cost Component</th>
                      <th className="py-3 px-4 text-right">Basis</th>
                      <th className="py-3 px-4 text-right">Amount (KSh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                    <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <HardHat className="w-3.5 h-3.5 inline mr-1.5 text-emerald-500" />
                        Construction Cost
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">GFA × Rate/m²</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatKSh(breakdown.constructionCost)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 pl-8">
                        External Works
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">{(breakdown.config.externalWorksRate * 100).toFixed(1)}% of construction</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatKSh(breakdown.externalWorks)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 pl-8">
                        Preliminaries
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">{(breakdown.config.preliminariesRate * 100).toFixed(1)}% of construction</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatKSh(breakdown.preliminaries)}</td>
                    </tr>
                    {breakdown.professionalFees.map((fee) => (
                      <tr key={fee.name} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 pl-8">
                          <FileText className="w-3.5 h-3.5 inline mr-1.5 text-sky-500" />
                          {fee.name}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">{(fee.rate * 100).toFixed(1)}% of construction</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatKSh(fee.amount)}</td>
                      </tr>
                    ))}
                    <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 pl-8">
                        <Landmark className="w-3.5 h-3.5 inline mr-1.5 text-violet-500" />
                        Statutory Costs
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">{(breakdown.config.statutoryCostsRate * 100).toFixed(1)}% of construction</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatKSh(breakdown.statutoryCosts)}</td>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-950/30">
                      <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">Subtotal</td>
                      <td className="py-3.5 px-4"></td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">{formatKSh(breakdown.subtotal)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 text-amber-500" />
                        Contingency
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">{(breakdown.config.contingencyRate * 100).toFixed(1)}% of subtotal</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatKSh(breakdown.contingency)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <Wallet className="w-3.5 h-3.5 inline mr-1.5 text-rose-500" />
                        VAT ({(breakdown.config.vatRate * 100).toFixed(0)}%)
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">On pre-VAT total</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatKSh(breakdown.vatAmount)}</td>
                    </tr>
                    <tr className="bg-slate-900 dark:bg-emerald-950/30 border-t-2 border-emerald-500">
                      <td className="py-4 px-4 font-black text-white uppercase text-xs">Total Project Cost</td>
                      <td className="py-4 px-4"></td>
                      <td className="py-4 px-4 text-right font-mono font-black text-emerald-400 text-sm">{formatKSh(breakdown.totalProjectCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TCO PROGRESSION */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Total Cost of Ownership ({breakdown.lifecycleYears}-Year Projection)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Total Project Cost</span>
                    <span className="font-mono font-extrabold text-xs text-slate-800 dark:text-slate-200">{formatKSh(breakdown.totalProjectCost)}</span>
                  </div>
                  <div className="text-slate-300 font-bold text-lg hidden md:block">+</div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Operational Cost ({breakdown.lifecycleYears}y)</span>
                    <span className="font-mono font-extrabold text-xs text-slate-800 dark:text-slate-200">{formatKSh(breakdown.annualOpex * breakdown.lifecycleYears)}</span>
                  </div>
                  <div className="text-slate-300 font-bold text-lg hidden md:block">=</div>
                  <div className="p-3 bg-slate-900 dark:bg-emerald-950/30 text-white rounded-xl border border-slate-800 dark:border-emerald-500/20">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">TCO</span>
                    <span className="font-mono font-black text-xs text-emerald-400">{formatKSh(breakdown.tco)}</span>
                  </div>
                </div>
              </div>

              {/* CITATION */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Regional pricing for {selectedCounty}. Construction standard: {config.constructionStandard}. VAT: {(config.vatRate * 100).toFixed(0)}%. Contingency: {(config.contingencyRate * 100).toFixed(1)}%. Last Updated: {lastUpdatedDate}.</span>
              </div>

              {/* TRANSPARENCY */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800 space-y-3 text-xs">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  How this estimate was generated
                </h5>
                <p className="text-[10px] text-slate-400 font-light leading-normal">
                  This estimate uses quantity-surveying principles: Gross Floor Area (GFA) multiplied by a cost-per-m² rate for the selected construction standard and building type.
                  Regional pricing from the {selectedCounty} database is applied. Professional fees, statutory costs, external works, preliminaries, and contingency are calculated as configurable percentages.
                  VAT at {(config.vatRate * 100).toFixed(0)}% is applied to the pre-VAT total. The {breakdown.lifecycleYears}-year TCO adds projected operational costs.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px] font-medium pt-1">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ GFA Calculation</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ Construction Standard</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ {selectedCounty} Pricing</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ Professional Fees</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ Statutory Costs</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ External Works</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ Contingency</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ VAT Included</span>
                </div>
              </div>

              {breakdown && (
                <NextStepGuide
                  currentStep="Cost Estimate Generated"
                  nextStep="AI Recommendations & Reports"
                  nextLabel="View AI Insights"
                />
              )}

            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
              <Cpu className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <p className="text-xs text-slate-400">No estimate generated yet. Click "Generate Estimate" to begin.</p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
