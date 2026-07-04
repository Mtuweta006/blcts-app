import React, { useState, useEffect, useMemo } from "react";
import { Cpu, Sparkles, Building2, Layers, RefreshCw, FileSliders as Sliders, Lightbulb, CircleCheck as CheckCircle2, Info, MapPin, ShieldCheck } from "lucide-react";
import { Property } from "../types";
import { getAllCounties, getPriceForLocation, getSafetyMarginFromStorage, PriceBreakdown } from "../utils/pricingEngine";
import { countyCities } from "../data/regionalPricing";

interface CostEstimationProps {
  selectedProperty: Property;
  triggerToast?: (msg: string, type?: "success" | "info" | "warning") => void;
}

interface CostItem {
  component: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  materialUsed?: string;
  calculationNotes?: string;
  basePrice?: number;
  safetyMargin?: number;
  finalPrice?: number;
}

export default function CostEstimation({ selectedProperty, triggerToast }: CostEstimationProps) {
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<CostItem[]>([]);
  const [totalConstructionCost, setTotalConstructionCost] = useState<number>(0);

  // Location state - synced with property county
  const [selectedCounty, setSelectedCounty] = useState<string>(selectedProperty?.county || "Nairobi");
  const [selectedCity, setSelectedCity] = useState<string>(selectedProperty?.city || "Nairobi CBD");
  const safetyMargin = getSafetyMarginFromStorage();

  // Manual overrides
  const [useManualOverride, setUseManualOverride] = useState(false);
  const [manualArea, setManualArea] = useState<number>(selectedProperty?.estimatedFloorArea || 2500);
  const [manualFloors, setManualFloors] = useState<number>(selectedProperty?.floors || 4);

  // Loading steps
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Uploading architectural drawing...",
    "Reading drawing...",
    "Extracting project information...",
    "Comparing with material database...",
    "Preparing cost estimation..."
  ];

  // Synced initial setup
  useEffect(() => {
    if (selectedProperty) {
      setManualArea(selectedProperty.estimatedFloorArea || 2500);
      setManualFloors(selectedProperty.floors || 4);
      setSelectedCounty(selectedProperty.county || "Nairobi");
      setSelectedCity(selectedProperty.city || "Nairobi CBD");
      generateRealEstimate(selectedProperty, false, selectedProperty.county || "Nairobi");
    }
  }, [selectedProperty?.id]);

  // Auto-regenerate when county changes
  useEffect(() => {
    if (selectedProperty && selectedCounty) {
      generateRealEstimate(selectedProperty, useManualOverride, selectedCounty);
    }
  }, [selectedCounty]);

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

  const generateRealEstimate = async (propertyObj: Property, manualMode: boolean, county: string) => {
    setLoading(true);
    const area = manualMode ? manualArea : propertyObj.estimatedFloorArea || 2500;
    const floors = manualMode ? manualFloors : propertyObj.floors || 4;

    try {
      // Get current local database materials to feed to backend indexer
      const savedMaterials = localStorage.getItem("blcts-materials");
      const materialsList = savedMaterials ? JSON.parse(savedMaterials) : [];

      const response = await fetch("/api/cost-estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          property: {
            ...propertyObj,
            estimatedFloorArea: area,
            floors: floors,
            county
          },
          materials: materialsList,
          county,
          safetyMargin
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact cost estimation endpoint.");
      }

      const data = await response.json();

      const mappedItems: CostItem[] = data.breakdown.map((item: any) => {
        // Try to get regional pricing for this component
        const regionalPrice = getPriceForLocation(item.component?.toLowerCase().includes("cement") ? "cement" :
          item.component?.toLowerCase().includes("foundation") ? "cement" :
          item.component?.toLowerCase().includes("frame") || item.component?.toLowerCase().includes("structure") ? "steel-y12" :
          item.component?.toLowerCase().includes("wall") ? "timber" :
          item.component?.toLowerCase().includes("roof") ? "roofing" :
          item.component?.toLowerCase().includes("plumb") ? "plumbing" :
          item.component?.toLowerCase().includes("electr") ? "electrical" :
          item.component?.toLowerCase().includes("paint") || item.component?.toLowerCase().includes("finish") ? "paint" :
          item.component?.toLowerCase().includes("window") || item.component?.toLowerCase().includes("door") || item.component?.toLowerCase().includes("glass") ? "glass" :
          item.component?.toLowerCase().includes("tile") ? "tiles" :
          item.component?.toLowerCase().includes("water") ? "waterproofing" :
          item.component?.toLowerCase().includes("hvac") ? "hvac" : "cement",
          "material", county);

        const basePrice = regionalPrice ? regionalPrice.basePrice : (item.unitPrice || 0);
        const margin = regionalPrice ? regionalPrice.safetyMargin : safetyMargin;
        const finalPrice = regionalPrice ? regionalPrice.finalPrice : (basePrice + margin);

        return {
          component: item.category || item.component || "Structural Component",
          quantity: item.quantity || 1,
          unit: item.unit || "Unit",
          unitPrice: finalPrice,
          totalCost: (item.quantity || 1) * finalPrice,
          materialUsed: item.materialUsed || "",
          calculationNotes: item.calculationNotes || "",
          basePrice,
          safetyMargin: margin,
          finalPrice
        };
      });

      setBreakdown(mappedItems);
      setTotalConstructionCost(mappedItems.reduce((sum, item) => sum + item.totalCost, 0));

      if (triggerToast) {
        triggerToast(`AI Cost Estimate compiled for ${county} with KSh ${safetyMargin} safety margin!`, "success");
      }
    } catch (err) {
      console.error("AI Estimation Error:", err);
      if (triggerToast) {
        triggerToast("Server connection error. Running regional pricing fallback.", "warning");
      }
      calculateLocalFallback(area, county);
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalFallback = (area: number, county: string = "Nairobi") => {
    const componentMappings = [
      { component: "Foundation", itemId: "cement", quantity: area * 1.25, unit: "CM", notes: "Foundation concrete volume based on soil conditions and footprint." },
      { component: "Structural Frame", itemId: "steel-y12", quantity: area * 0.45, unit: "CM", notes: "Reinforced frame column pours and cured structural slabs." },
      { component: "Walls", itemId: "timber", quantity: area * 1.85, unit: "SQM", notes: "Walling blockwork layout and masonry panels." },
      { component: "Roofing", itemId: "roofing", quantity: area * 1.1, unit: "SQM", notes: "Pitched metal sheet assembly with rainwater channels." },
      { component: "Windows & Doors", itemId: "glass", quantity: area * 0.15, unit: "SQM", notes: "Weather-proof double-glazed window panel sets." },
      { component: "Plumbing & Drainage", itemId: "plumbing", quantity: area, unit: "SQM", notes: "Fitted sub-mains and sanitary connections." },
      { component: "Electrical Installation", itemId: "electrical", quantity: area, unit: "SQM", notes: "Standard conduit cabling and circuit breaker layouts." },
      { component: "Finishes", itemId: "paint", quantity: area * 2.5, unit: "SQM", notes: "Washable plastering and interior wall finishing paint." }
    ];

    const items: CostItem[] = componentMappings.map(({ component, itemId, quantity, unit, notes }) => {
      const price = getPriceForLocation(itemId, "material", county);
      const basePrice = price ? price.basePrice : 1000;
      const margin = price ? price.safetyMargin : safetyMargin;
      const finalPrice = price ? price.finalPrice : basePrice + margin;
      return {
        component,
        quantity,
        unit,
        unitPrice: finalPrice,
        totalCost: quantity * finalPrice,
        calculationNotes: notes,
        basePrice,
        safetyMargin: margin,
        finalPrice
      };
    });

    const calculatedTotal = items.reduce((sum, item) => sum + item.totalCost, 0);
    setBreakdown(items);
    setTotalConstructionCost(calculatedTotal);
  };

  const handleRunEstimation = () => {
    generateRealEstimate(selectedProperty, useManualOverride, selectedCounty);
  };

  // Automatically calculated Total Cost of Ownership
  const estimatedOperationalCost = (selectedProperty?.opexBudget || 15000000) * 30;
  const calculatedTCO = totalConstructionCost + estimatedOperationalCost;

  // Derive Recommendations from cost items
  const getDynamicRecommendations = () => {
    const recs = [];
    
    // Find foundation or superstructure cost
    const foundationItem = breakdown.find(item => item.component.toLowerCase().includes("foundation"));
    const structuralItem = breakdown.find(item => item.component.toLowerCase().includes("frame") || item.component.toLowerCase().includes("structure"));
    const roofingItem = breakdown.find(item => item.component.toLowerCase().includes("roof"));

    if (foundationItem && foundationItem.totalCost > 1500000) {
      recs.push({
        title: "Foundation Waterproofing Upgrade",
        text: "Consider higher-grade membrane waterproofing during sub-grade laying to eliminate structural dampness risk, preserving foundation integrity over 30 years."
      });
    } else {
      recs.push({
        title: "Standard Foundation Preservation",
        text: "Current foundation specifications are fully sufficient. Implement basic protective damp courses to ensure design lifespan is achieved."
      });
    }

    if (structuralItem && structuralItem.totalCost > 10000000) {
      recs.push({
        title: "Reinforcement Steel Sizing",
        text: "Upgrading reinforcement steel grades from standard T12 to T16 raises initial construction cost slightly but increases load margins and prevents structural sagging."
      });
    }

    if (roofingItem && roofingItem.totalCost > 500000) {
      recs.push({
        title: "Reflective Cool Roofing",
        text: "Using a high-reflectivity thermal coating on the roofing sheets will reduce annual HVAC utility cooling costs by 15%."
      });
    } else {
      recs.push({
        title: "Durable Roofing Finish",
        text: "Standard pitched metal sheets are recommended to limit standing water buildup, reducing long-term leakage repairs."
      });
    }

    return recs.slice(0, 3);
  };

  const currentRecs = getDynamicRecommendations();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 text-left space-y-6 animate-fade-in" id="ai-cost-estimation-page">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            AI Cost Estimation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-light">
            Generate preliminary cost plans for key construction components. Fully cross-referenced with local materials database.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Current Project</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            {selectedProperty?.name || "No Project Loaded"}
          </span>
        </div>
      </div>

      {/* PARAMETERS INPUT & ESTIMATE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Control Column */}
        <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-5 space-y-5">
          <h4 className="text-xs font-bold text-slate-850 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-emerald-500" />
            Parameters
          </h4>

          {/* Toggle manual override */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Manual Spec Override</span>
            <button
              onClick={() => setUseManualOverride(!useManualOverride)}
              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                useManualOverride ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-800"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  useManualOverride ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-450 block">County (Location)</label>
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
              <label className="text-[10px] uppercase font-bold text-slate-450 block">City/Town</label>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
              >
                {(countyCities[selectedCounty] || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-450 block">Floor Area (SQM)</label>
              <input
                type="number"
                disabled={!useManualOverride}
                value={useManualOverride ? manualArea : selectedProperty?.estimatedFloorArea || 2500}
                onChange={(e) => setManualArea(parseFloat(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-900 font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-450 block">Number of Floors</label>
              <input
                type="number"
                disabled={!useManualOverride}
                value={useManualOverride ? manualFloors : selectedProperty?.floors || 4}
                onChange={(e) => setManualFloors(parseInt(e.target.value) || 1)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-900 font-mono font-bold"
              />
            </div>

            {/* Safety Margin Display */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Safety Margin Active</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">KSh {safetyMargin} per unit</span>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 font-light">Auto-applied to all base prices</p>
            </div>
          </div>

          <button
            onClick={handleRunEstimation}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>Generate Estimate</span>
          </button>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-teal-500" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Material & Quantity Estimation Breakdown
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-500" />
              Prices: {selectedCounty} Index
            </span>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {loadingSteps[loadingStep]}
                </p>
                <p className="text-[10px] text-slate-400 font-light max-w-xs leading-normal">
                  Our neural network is processing specifications and generating localized construction estimates...
                </p>
              </div>
              
              {/* Progress Bar Mock */}
              <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* CLEAN TABLE */}
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 dark:text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider border-b border-slate-150 dark:border-slate-850">
                      <th className="py-3 px-4">Component</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4 text-right">Base Price</th>
                      <th className="py-3 px-4 text-right">Margin</th>
                      <th className="py-3 px-4 text-right">Final Price</th>
                      <th className="py-3 px-4 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                    {breakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors align-top">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.component}</span>
                          {item.materialUsed && (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-semibold mt-0.5">
                              Index Match: {item.materialUsed}
                            </span>
                          )}
                          {item.calculationNotes && (
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 block font-light mt-1 max-w-sm leading-normal">
                              {item.calculationNotes}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                          {item.quantity.toLocaleString(undefined, {maximumFractionDigits: 1})} <span className="text-[10px] text-slate-400 font-light uppercase">{item.unit}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500 dark:text-slate-500">
                          KSh {(item.basePrice || item.unitPrice - (item.safetyMargin || 0)).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-amber-500">
                          +KSh {(item.safetyMargin || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          KSh {(item.finalPrice || item.unitPrice).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          KSh {item.totalCost.toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CITATION LABEL */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Regional prices for {selectedCounty} with KSh {safetyMargin} safety margin applied. Last Updated: July 2026.</span>
              </div>

              {/* VISUAL TCO PROGRESSION */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-850 space-y-4">
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                  Total Cost of Ownership (TCO) Lifecycle Progression
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Construction Cost</span>
                    <span className="font-mono font-extrabold text-xs text-slate-850 dark:text-slate-200">
                      KSh {totalConstructionCost.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                  </div>
                  
                  <div className="text-slate-300 font-bold text-lg hidden md:block">+</div>
                  
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Estimated Operational Cost</span>
                    <span className="font-mono font-extrabold text-xs text-slate-850 dark:text-slate-200">
                      KSh {estimatedOperationalCost.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                  </div>
                  
                  <div className="text-slate-300 font-bold text-lg hidden md:block">=</div>

                  <div className="p-3 bg-slate-900 dark:bg-emerald-950/30 text-white rounded-xl border border-slate-800 dark:border-emerald-500/20">
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-400 block mb-1">30-Year TCO</span>
                    <span className="font-mono font-black text-xs text-emerald-400">
                      KSh {calculatedTCO.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                  </div>
                </div>
              </div>

              {/* ESTIMATED-LINKED AI RECOMMENDATIONS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Estimate-Linked Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentRecs.map((rec, i) => (
                    <div key={i} className="p-4 bg-amber-50/20 dark:bg-slate-950/30 border border-amber-500/10 rounded-xl space-y-1">
                      <h5 className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                        {rec.title}
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-light">
                        {rec.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* TRANSPARENCY BLOCK */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-850 space-y-3 text-xs">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  How this estimate was generated (Transparency Model)
                </h5>
                <p className="text-[10px] text-slate-400 font-light leading-normal">
                  This multi-layered lifecycle cost estimate blends real-time {selectedCounty} regional material index prices, structural calculations, and a standardized 30-year operational lifecycle projection. A safety margin of KSh {safetyMargin} is automatically applied to every base price.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px] font-medium pt-1">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ Architectural Plan</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ Building Type</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ Floor Area</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ Floors</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ {selectedCounty} Prices</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ Safety Margin</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ AI Quantities</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">✓ Lifecycle Model</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}

