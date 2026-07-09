/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Menu, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Info, Building2, Plus, Sun, Moon, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  initialProperties,
  initialCostEntries,
  initialMaintenanceTasks,
  initialVendors,
  initialMaterials,
  initialAssets,
  initialMaintenanceRecords,
  initialCompliance,
  initialSustainability,
  initialPredictions,
  initialAnomalies,
  initialNotifications,
  initialSystemSettings,
  getFinancialTrends,
  getAIInsights
} from "./data";
import { Property, CostEntry, MaintenanceTask, LifecyclePhase, User, Vendor, Material, Asset, MaintenanceRecord, ComplianceItem, SustainabilityMetric, AIPrediction, Anomaly, AppNotification, SystemSettings, AuditLog, isAdminRole, isFacilityManagerRole, isOwnerRole } from "./types";

// Import modular sub-components for "Professional Polish" theme and chunked optimization
import Sidebar from "./components/Sidebar";
import ExecutiveDashboard from "./components/ExecutiveDashboard";
import AdminDashboard from "./components/AdminDashboard";
import FacilityDashboard from "./components/FacilityDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import SystemSettingsPanel from "./components/SystemSettings";
import UserManagement from "./components/UserManagement";
import VendorCenter from "./components/VendorCenter";
import AddCostModal from "./components/AddCostModal";
import AuthScreen from "./components/AuthScreen";
import LandingPage from "./components/LandingPage";
import PropertyManagement from "./components/PropertyManagement";
import CostEstimation from "./components/CostEstimation";
import Reports from "./components/Report";
import AssetManagement from "./components/AssetManagement";
import MaintenanceManagement from "./components/MaintenanceManagement";
import AIPredictions from "./components/AIPredictions";
import Sustainability from "./components/Sustainability";
import Compliance from "./components/Compliance";
import Notifications from "./components/Notifications";
import { ActiveTabType } from "./types";
import { getSafetyMarginFromStorage, setSafetyMarginToStorage } from "./utils/pricingEngine";



const getInitials = (fullName: string) => {
  if (!fullName) return "AW";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase();
};

export default function App() {
  // User Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("blcts-user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [showAuthOnly, setShowAuthOnly] = useState<boolean>(false);

  // Theme state manager (persisted in local storage)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("blcts-theme");
      return stored === "dark";
    } catch (e) {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const nextTheme = !prev;
      try {
        localStorage.setItem("blcts-theme", nextTheme ? "dark" : "light");
      } catch (e) {}
      triggerToast(`Theme switched to ${nextTheme ? "Dark" : "Light"} Mode`, "info");
      return nextTheme;
    });
  };

  // State managers
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("prop-1");
  const [costEntries, setCostEntries] = useState<CostEntry[]>(initialCostEntries);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(initialMaintenanceTasks);
  const [vendors] = useState<Vendor[]>(initialVendors);
  const [materials] = useState<Material[]>(initialMaterials);
  const [assets] = useState<Asset[]>(initialAssets);
  const [maintenanceRecords] = useState<MaintenanceRecord[]>(initialMaintenanceRecords);
  const [complianceItems] = useState<ComplianceItem[]>(initialCompliance);
  const [sustainabilityMetrics] = useState<SustainabilityMetric[]>(initialSustainability);
  const [predictions] = useState<AIPrediction[]>(initialPredictions);
  const [anomalies] = useState<Anomaly[]>(initialAnomalies);
  const [notifications] = useState<AppNotification[]>(initialNotifications);

  // System Settings state (persisted in local storage)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    try {
      const stored = localStorage.getItem("blcts-system-settings");
      if (stored) return { ...initialSystemSettings, ...JSON.parse(stored) };
    } catch (e) {}
    return initialSystemSettings;
  });

  const updateSystemSettings = (updates: Partial<SystemSettings>) => {
    setSystemSettings(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("blcts-system-settings", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleSafetyMarginChange = (margin: number) => {
    setSafetyMarginToStorage(margin);
    updateSystemSettings({ safetyMargin: margin });
    triggerToast(`Safety margin updated to KSh ${margin}`, "success");
  };

  const addAuditLog = (action: string, details: string, propertyId?: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action,
      details,
      propertyId
    };
    updateSystemSettings({ auditLogs: [newLog, ...systemSettings.auditLogs] });
  };

  // Role detection
  const userIsAdmin = currentUser ? isAdminRole(currentUser.role) : false;
  const userIsFacilityManager = currentUser ? isFacilityManagerRole(currentUser.role) : false;
  const userIsOwner = currentUser ? isOwnerRole(currentUser.role) : false;
  
  // UI states
  const [activeTab, setActiveTab] = useState<ActiveTabType>("dashboard");

  // Auto-redirect to role-appropriate dashboard on login
  React.useEffect(() => {
    if (currentUser && activeTab === "dashboard") {
      if (userIsAdmin) setActiveTab("admin-dashboard");
      else if (userIsFacilityManager) setActiveTab("facility-dashboard");
      else if (userIsOwner) setActiveTab("owner-dashboard");
    }
  }, [currentUser]);

  // Tab guard: prevent unauthorized tab access based on role
  React.useEffect(() => {
    if (!currentUser) return;
    const adminOnlyTabs: ActiveTabType[] = ["admin-dashboard", "user-management", "system-settings"];
    const fmOnlyTabs: ActiveTabType[] = ["facility-dashboard"];
    const ownerOnlyTabs: ActiveTabType[] = ["owner-dashboard"];
    const ownerForbiddenTabs: ActiveTabType[] = ["admin-dashboard", "facility-dashboard", "cost-estimation", "vendors", "assets", "maintenance", "compliance", "user-management", "system-settings"];

    if (userIsOwner && (ownerForbiddenTabs.includes(activeTab) || (!ownerOnlyTabs.includes(activeTab) && !["dashboard", "properties-mgmt", "ai-predictions", "sustainability", "reports", "notifications"].includes(activeTab)))) {
      setActiveTab("owner-dashboard");
    }
    if (userIsFacilityManager && (adminOnlyTabs.includes(activeTab) || ownerOnlyTabs.includes(activeTab))) {
      setActiveTab("facility-dashboard");
    }
    if (userIsAdmin && (fmOnlyTabs.includes(activeTab) || ownerOnlyTabs.includes(activeTab))) {
      // Admin can view FM/owner dashboards for oversight, so allow — no redirect
    }
  }, [activeTab, currentUser, userIsAdmin, userIsFacilityManager, userIsOwner]);
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "sw">("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("All");
  
  // Sidebar states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);

  // New Invoice/Entry Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    phase: "Operational" as LifecyclePhase,
    component: "",
    amount: "",
    contractor: "",
    date: new Date().toISOString().substring(0, 10),
    description: ""
  });
  const [formError, setFormError] = useState("");

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info" | "warning">("success");

  // Selected property helper
  const selectedProperty = useMemo(() => {
    return properties.find(p => p.id === selectedPropertyId) || properties[0];
  }, [properties, selectedPropertyId]);

  // Toast trigger helper
  const triggerToast = (msg: string, type: "success" | "info" | "warning" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleLoginSuccess = (userPayload: User) => {
    setCurrentUser(userPayload);
    try {
      localStorage.setItem("blcts-user", JSON.stringify(userPayload));
    } catch (e) {}
    triggerToast(`Welcome back, ${userPayload.name}! Access granted as ${userPayload.role}.`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("blcts-user");
    } catch (e) {}
    triggerToast("Logged out successfully. Secure session terminated.", "info");
  };

  // Switch property
  const handlePropertyChange = (id: string) => {
    setSelectedPropertyId(id);
    setIsPropertyDropdownOpen(false);
    triggerToast(`Switched active property to: ${properties.find(p => p.id === id)?.name}`, "info");
  };

  // Update property cost parameters (TCO components)
  const handleUpdateProperty = (updated: Property) => {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  // CAPEX, OPEX and TCO Calculations for the active property
  const calculations = useMemo(() => {
    const propCosts = costEntries.filter(entry => entry.propertyId === selectedPropertyId);
    
    const capexTotal = propCosts
      .filter(c => c.phase === "Construction")
      .reduce((sum, item) => sum + item.amount, 0) + (selectedPropertyId === "prop-1" ? 120000000 : selectedPropertyId === "prop-2" ? 85000000 : 180000000); // base structural CAPEX estimates added to give realistic totals
      
    const opexTotal = propCosts
      .filter(c => c.phase === "Operational" || c.phase === "Maintenance")
      .reduce((sum, item) => sum + item.amount, 0);

    const paidMaintenanceTotal = maintenanceTasks
      .filter(t => t.propertyId === selectedPropertyId && t.status === "Paid")
      .reduce((sum, item) => sum + item.amount, 0);

    // Dynamic calculations
    const combinedOpex = opexTotal + paidMaintenanceTotal;
    const totalCostOfOwnership = capexTotal + combinedOpex;

    const lifecycleTco = (selectedProperty?.initialConstructionCost || 0) +
      (selectedProperty?.materialCost || 0) +
      (selectedProperty?.labourCost || 0) +
      (selectedProperty?.maintenanceCost || 0) +
      (selectedProperty?.utilityCost || 0) +
      (selectedProperty?.repairCost || 0) +
      (selectedProperty?.renovationCost || 0) +
      (selectedProperty?.otherCost || 0);

    return {
      capex: capexTotal,
      opex: combinedOpex,
      tco: lifecycleTco > 0 ? lifecycleTco : totalCostOfOwnership,
      lifecycleTco: lifecycleTco,
      entryCount: propCosts.length
    };
  }, [costEntries, selectedPropertyId, maintenanceTasks, selectedProperty]);

  // AI insights based on Selected Property
  const activeInsights = useMemo(() => {
    return getAIInsights(selectedPropertyId);
  }, [selectedPropertyId]);

  // Financial Chart details mapping (Budget vs Actual)
  const trendsData = useMemo(() => {
    return getFinancialTrends(selectedPropertyId);
  }, [selectedPropertyId]);

  // SVG Chart drawing calculations
  const svgChartPaths = useMemo(() => {
    if (trendsData.length === 0) return { capexBudgetPath: "", capexActualPath: "", opexBudgetPath: "", opexActualPath: "", capexFillPath: "", opexFillPath: "", coords: [] };
    
    // Scale points to draw beautiful smooth lines in SVG viewBox="0 0 600 200"
    const width = 600;
    const height = 200;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find custom dynamic max val to scale chart coordinates precisely
    const allValues = trendsData.flatMap(d => [d.capexBudget, d.capexActual, d.opexBudget, d.opexActual]);
    const maxVal = (allValues.length > 0 ? Math.max(...allValues) : 1000000) * 1.1 || 1000000;

    const getX = (index: number) => padding + (index / (trendsData.length - 1 || 1)) * chartWidth;
    const getY = (value: number) => padding + chartHeight - (value / maxVal) * chartHeight;

    // Construct point strings
    let capexActualPoints = "";
    let capexBudgetPoints = "";
    let opexActualPoints = "";
    let opexBudgetPoints = "";

    trendsData.forEach((d, i) => {
      const x = getX(i);
      
      const yCapexAct = getY(d.capexActual);
      capexActualPoints += `${i === 0 ? "M" : "L"} ${x} ${yCapexAct} `;

      const yCapexBud = getY(d.capexBudget);
      capexBudgetPoints += `${i === 0 ? "M" : "L"} ${x} ${yCapexBud} `;

      const yOpexAct = getY(d.opexActual);
      opexActualPoints += `${i === 0 ? "M" : "L"} ${x} ${yOpexAct} `;

      const yOpexBud = getY(d.opexBudget);
      opexBudgetPoints += `${i === 0 ? "M" : "L"} ${x} ${yOpexBud} `;
    });

    // Create fill path strings
    const capexFillPath = `${capexActualPoints} L ${getX(trendsData.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;
    const opexFillPath = `${opexActualPoints} L ${getX(trendsData.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

    return {
      capexActualPath: capexActualPoints,
      capexBudgetPath: capexBudgetPoints,
      opexActualPath: opexActualPoints,
      opexBudgetPath: opexBudgetPoints,
      capexFillPath,
      opexFillPath,
      coords: trendsData.map((d, i) => ({
        x: getX(i),
        yCapexAct: getY(d.capexActual),
        yCapexBud: getY(d.capexBudget),
        yOpexAct: getY(d.opexActual),
        yOpexBud: getY(d.opexBudget),
        month: d.month,
        raw: d
      }))
    };
  }, [trendsData]);

  // Filter accounts/contracts
  const filteredTasks = useMemo(() => {
    return maintenanceTasks.filter(task => {
      const matchProperty = task.propertyId === selectedPropertyId;
      const matchQuery = task.component.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.contractor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPhase = phaseFilter === "All" || 
                          (phaseFilter === "Paid" && task.status === "Paid") || 
                          (phaseFilter === "Active" && task.status !== "Paid");
      return matchProperty && matchQuery && matchPhase;
    });
  }, [maintenanceTasks, selectedPropertyId, searchQuery, phaseFilter]);

  // Filter cost ledger entries for property
  const filteredLedgerEntries = useMemo(() => {
    return costEntries.filter(entry => {
      const matchProperty = entry.propertyId === selectedPropertyId;
      const matchQuery = entry.component.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          entry.contractor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPhase = phaseFilter === "All" || entry.phase === phaseFilter;
      return matchProperty && matchQuery && matchPhase;
    });
  }, [costEntries, selectedPropertyId, searchQuery, phaseFilter]);

  // Add new entry submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { phase, component, amount, contractor, date, description } = newEntry;

    if (!component || !amount || !contractor) {
      setFormError("Kindly fill in all required fields marked with *");
      return;
    }

    const parsedAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid amount in Kenyan Shillings (KES)");
      return;
    }

    const entryId = `cost-user-${Date.now()}`;
    const newRecord: CostEntry = {
      id: entryId,
      propertyId: selectedPropertyId,
      phase,
      component,
      amount: parsedAmount,
      date,
      contractor,
      status: "Paid",
      description: description || "Manually logged via Developer Portal"
    };

    setCostEntries([newRecord, ...costEntries]);
    setIsAddModalOpen(false);
    
    // Clear state
    setNewEntry({
      phase: "Operational",
      component: "",
      amount: "",
      contractor: "",
      date: new Date().toISOString().substring(0, 10),
      description: ""
    });
    setFormError("");

    // Trigger toast notification
    triggerToast(`Success: Recorded KSh ${parsedAmount.toLocaleString()} under ${phase} phase!`, "success");

    // Also inject a Maintenance Schedule item if it is in the maintenance phase
    if (phase === "Maintenance") {
      const newTask: MaintenanceTask = {
        id: `maint-user-${Date.now()}`,
        propertyId: selectedPropertyId,
        component,
        status: "Completed",
        targetDate: date,
        contractor,
        amount: parsedAmount,
        phone: "254712345678"
      };
      setMaintenanceTasks(prev => [newTask, ...prev]);
    }
  };

  if (!currentUser) {
    if (!showAuthOnly) {
      return (
        <div className={`min-h-screen ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-205`}>
          {/* Toast Notifications */}
          {toastMessage && (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-slate-950 text-white py-3 px-5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-slate-900 animate-slide-in">
              {toastType === "success" && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />}
              {toastType === "info" && <Info className="w-4.5 h-4.5 text-teal-400 shrink-0" />}
              {toastType === "warning" && <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />}
              <div className="text-xs font-semibold tracking-wide">{toastMessage}</div>
            </div>
          )}
          <LandingPage 
            onEnterApp={() => {
              setShowAuthOnly(true);
            }} 
            onEnterAuth={(tab) => {
              setShowAuthOnly(true);
            }} 
            isDarkMode={isDarkMode} 
            toggleDarkMode={toggleTheme} 
          />
        </div>
      );
    }

    return (
      <div className={`min-h-screen ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200 relative`}>
        {/* Back navigation banner */}
        <div className="absolute top-6 left-6 z-50">
          <button 
            onClick={() => setShowAuthOnly(false)} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer shadow-sm transition-all hover:scale-95 active:scale-90"
          >
            ← Back to Home
          </button>
        </div>

        {/* Toast Notifications */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-slate-950 text-white py-3 px-5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-slate-900 animate-slide-in">
            {toastType === "success" && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />}
            {toastType === "info" && <Info className="w-4.5 h-4.5 text-teal-400 shrink-0" />}
            {toastType === "warning" && <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />}
            <div className="text-xs font-semibold tracking-wide">{toastMessage}</div>
          </div>
        )}
        <AuthScreen 
          onLoginSuccess={handleLoginSuccess} 
          isDarkMode={isDarkMode} 
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200`}>
      
      {/* Toast Notifications */}
      <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-4 right-4 z-50 flex flex-col bg-slate-950 text-white py-3 px-5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-slate-900 overflow-hidden"
        >
          <div className="flex items-center gap-3">
            {toastType === "success" && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />}
            {toastType === "info" && <Info className="w-4.5 h-4.5 text-teal-400 shrink-0" />}
            {toastType === "warning" && <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />}
            <div className="text-xs font-semibold tracking-wide">{toastMessage}</div>
          </div>
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 4.5, ease: "linear" }}
            className={`h-0.5 mt-2 ${toastType === "success" ? "bg-emerald-500" : toastType === "info" ? "bg-teal-500" : "bg-amber-500"}`}
          />
        </motion.div>
      )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Left Sidebar Layout */}
        <Sidebar
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handlePropertyChange={handlePropertyChange}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          isPropertyDropdownOpen={isPropertyDropdownOpen}
          setIsPropertyDropdownOpen={setIsPropertyDropdownOpen}
          selectedProperty={selectedProperty}
          entryCount={calculations.entryCount}
          currentLanguage={currentLanguage}
          unreadNotifications={notifications.filter(n => !n.isRead).length}
          userIsAdmin={userIsAdmin}
          userIsFacilityManager={userIsFacilityManager}
          userIsOwner={userIsOwner}
        />

        {/* Outer overlay for mobile sidebar */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 lg:hidden cursor-default transition-all duration-300"
          />
        )}

        {/* Main Workspace Frame */}
        <main className="flex-1 min-w-0 lg:pl-64 flex flex-col min-h-screen">
          
          {/* Top Utility Bar */}
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-[0_1px_5px_-2px_rgba(0,0,0,0.02)] transition-colors duration-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg lg:hidden transition-colors cursor-pointer"
              >
                <Menu className="w-5.5 h-5.5" />
              </button>
              <div>
                <span className="hidden sm:inline text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-extrabold leading-none font-display">
                  Building Lifecycle Cost Tracker
                </span>
                <span className="text-slate-955 dark:text-white font-black text-sm sm:text-base block leading-tight font-display tracking-tight mt-0.5">
                  {selectedProperty.name}
                </span>
              </div>
            </div>

            {/* Top Navigation Utilities */}
            <div className="flex items-center gap-4">
              {/* Add Cost Entry Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-slate-950 dark:text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider py-2 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Cost Entry</span>
                <span className="inline sm:hidden">Add Cost</span>
              </button>

              {/* Alert Warning Count Indicator */}
              <div className="hidden md:flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[10px] uppercase font-bold py-1 px-3 rounded-full border border-amber-250/50 dark:border-amber-800/40">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span>{activeInsights.filter(i => i.type === "alert" || i.type === "warning").length} Warnings</span>
              </div>

              {/* Theme Toggle Button */}
              <button
                id="theme-toggle-btn"
                onClick={toggleTheme}
                className="p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center relative group"
                aria-label="Toggle Theme"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600 transition-transform duration-300" />
                )}
                {/* Tooltip hint */}
                <span className="absolute -bottom-9 scale-0 group-hover:scale-100 transition-all duration-150 origin-top bg-slate-900 text-white text-[9px] font-bold px-2.5 py-1 rounded shadow-lg whitespace-nowrap z-50">
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </span>
              </button>

              {/* Connected Dynamic Profile Info */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-100 dark:border-slate-800">
                <div className="text-right hidden sm:block">
                  <span className="text-slate-955 dark:text-slate-100 text-xs font-bold block leading-none">
                    {currentUser?.name || "Administrator"}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-[9px] block uppercase font-mono font-bold tracking-wider mt-1">
                    {currentUser?.role || "System Administrator"}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-950 dark:bg-slate-900 text-slate-100 font-extrabold text-xs flex items-center justify-center border border-slate-800 dark:border-slate-700 shadow-sm select-none">
                  {currentUser ? getInitials(currentUser.name) : "AW"}
                </div>
                
                {/* Modern Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl border border-rose-200/50 dark:border-rose-950/50 text-rose-500 hover:text-rose-400 bg-rose-50/20 dark:bg-rose-955/20 hover:bg-rose-50/50 dark:hover:bg-rose-950/40 cursor-pointer transition-all shrink-0 flex items-center justify-center group relative h-8 w-8"
                  title="Secure Session Terminate"
                  aria-label="Secure Session Terminate"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="absolute -bottom-9 scale-0 group-hover:scale-100 transition-all duration-150 origin-top bg-rose-950 dark:bg-slate-900 text-white text-[9px] font-bold px-2.5 py-1 rounded shadow-lg whitespace-nowrap z-50">
                    Secure Session Terminate
                  </span>
                </button>
              </div>
            </div>
          </header>

          {/* Layout Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">

            {/* TAB VIEWS */}
            <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
            {activeTab === "dashboard" && (
              <ExecutiveDashboard
                selectedProperty={selectedProperty}
                selectedPropertyId={selectedPropertyId}
                calculations={calculations}
                svgChartPaths={svgChartPaths}
                activeInsights={activeInsights}
                filteredTasks={filteredTasks}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                phaseFilter={phaseFilter}
                setPhaseFilter={setPhaseFilter}
                setActiveTab={setActiveTab as any}
                triggerToast={triggerToast}
                costTrends={trendsData}
                propertiesList={properties}
                maintTasksList={maintenanceTasks}
                onUpdateProperty={handleUpdateProperty}
                vendors={vendors}
                assets={assets}
                compliance={complianceItems}
                sustainability={sustainabilityMetrics}
                predictions={predictions}
                anomalies={anomalies}
              />
            )}

            {activeTab === "admin-dashboard" && userIsAdmin && (
              <AdminDashboard
                properties={properties}
                costEntries={costEntries}
                maintenanceTasks={maintenanceTasks}
                vendors={vendors}
                assets={assets}
                compliance={complianceItems}
                predictions={predictions}
                anomalies={anomalies}
                notifications={notifications}
                systemSettings={systemSettings}
                setActiveTab={setActiveTab}
                triggerToast={triggerToast}
                currentUser={currentUser}
              />
            )}

            {activeTab === "facility-dashboard" && userIsFacilityManager && (
              <FacilityDashboard
                selectedProperty={selectedProperty}
                selectedPropertyId={selectedPropertyId}
                calculations={calculations}
                maintenanceTasks={maintenanceTasks}
                assets={assets}
                compliance={complianceItems}
                sustainability={sustainabilityMetrics}
                predictions={predictions}
                notifications={notifications}
                anomalies={anomalies}
                setActiveTab={setActiveTab}
                triggerToast={triggerToast}
                currentUser={currentUser}
              />
            )}

            {activeTab === "owner-dashboard" && userIsOwner && (
              <OwnerDashboard
                properties={properties}
                costEntries={costEntries}
                maintenanceTasks={maintenanceTasks}
                predictions={predictions}
                anomalies={anomalies}
                compliance={complianceItems}
                sustainability={sustainabilityMetrics}
                assets={assets}
                notifications={notifications}
                setActiveTab={setActiveTab}
                triggerToast={triggerToast}
                currentUser={currentUser}
              />
            )}

            {activeTab === "system-settings" && userIsAdmin && (
              <SystemSettingsPanel
                systemSettings={systemSettings}
                onSafetyMarginChange={handleSafetyMarginChange}
                onUpdateSettings={updateSystemSettings}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === "user-management" && userIsAdmin && (
              <UserManagement
                currentUser={currentUser}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === "properties-mgmt" && (
              <PropertyManagement
                properties={properties}
                setProperties={setProperties}
                selectedPropertyId={selectedPropertyId}
                setSelectedPropertyId={setSelectedPropertyId}
                costEntries={costEntries}
                setCostEntries={setCostEntries}
                maintenanceTasks={maintenanceTasks}
                setMaintenanceTasks={setMaintenanceTasks}
                currentLanguage={currentLanguage}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === "cost-estimation" && (
              <CostEstimation
                selectedProperty={selectedProperty}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === "vendors" && (
              <VendorCenter vendors={vendors} materials={materials} triggerToast={triggerToast} />
            )}

            {activeTab === "assets" && (
              <AssetManagement
                assets={assets}
                selectedPropertyId={selectedPropertyId}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === "maintenance" && (
              <MaintenanceManagement
                maintenanceRecords={maintenanceRecords}
                assets={assets}
                selectedPropertyId={selectedPropertyId}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === "ai-predictions" && (
              <AIPredictions
                predictions={predictions}
                anomalies={anomalies}
                selectedPropertyId={selectedPropertyId}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === "sustainability" && (
              <Sustainability
                sustainability={sustainabilityMetrics}
                selectedPropertyId={selectedPropertyId}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === "compliance" && (
              <Compliance
                compliance={complianceItems}
                selectedPropertyId={selectedPropertyId}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === "notifications" && (
              <Notifications
                notifications={notifications}
                selectedPropertyId={selectedPropertyId}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === "reports" && (
              <Reports
                selectedProperty={selectedProperty}
                costEntries={costEntries.filter((e) => e.propertyId === selectedPropertyId)}
                maintenanceTasks={maintenanceTasks.filter((t) => t.propertyId === selectedPropertyId)}
                calculations={calculations}
                predictions={predictions.filter((p) => p.propertyId === selectedPropertyId)}
                anomalies={anomalies.filter((a) => a.propertyId === selectedPropertyId)}
                compliance={complianceItems.filter((c) => c.propertyId === selectedPropertyId)}
                sustainability={sustainabilityMetrics.filter((s) => s.propertyId === selectedPropertyId)}
                vendors={vendors}
                assets={assets.filter((a) => a.propertyId === selectedPropertyId)}
                triggerToast={triggerToast}
              />
            )}
            </motion.div>
            </AnimatePresence>

            {/* EDUCATION FOOTER OUTLINE ON TOTAL COST OF OWNERSHIP */}
            <footer className="bg-white rounded-2xl p-6 border border-slate-200/60 text-xs text-slate-500 space-y-3 leading-relaxed shadow-[0_1px_4px_rgba(0,0,0,0.01)] font-sans">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 font-display">
                <Building2 className="w-4.5 h-4.5 text-slate-700" />
                <span>About the Building Lifecycle Cost Tracking System (BLCTS)</span>
              </h4>
              <p className="font-light">
                In Nairobi, Mombasa, and growing Kenyan municipalities, developers often succumb to the <strong>&quot;first-cost bias&quot;</strong>: evaluating structural components solely by their initial design invoices instead of forecasting 25-year cumulative durability limits. This leads to cheap roofing being purchased that fails in wet seasons, or poor-efficiency HVAC compressors inflating commercial power bills with inductive load charges from Kenya Power.
              </p>
              <p className="font-light">
                <strong>BLCTS</strong> corrects this by visualizing the true <strong>Total Cost of Ownership (TCO)</strong>. It aggregates actual construction outlays with utility bills, enabling developers to model lifecycle costs, optimize materials selection, and make decisions that reduce operational expenditure.
              </p>
            </footer>

          </div>
        </main>
      </div>

      {/* MODAL WINDOWS */}
      <AddCostModal
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        newEntry={newEntry}
        setNewEntry={setNewEntry}
        handleAddSubmit={handleAddSubmit}
        formError={formError}
      />

    </div>
  );
}