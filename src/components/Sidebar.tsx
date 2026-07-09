import React from "react";
import {
  Activity,
  X,
  Building,
  MapPin,
  FileText,
  Cpu,
  Sparkles,
  Wrench,
  ShieldCheck,
  Leaf,
  Bell,
  Users,
  Boxes,
  Settings,
  UserCog,
  LayoutDashboard,
  Building2,
  Crown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Property, ActiveTabType } from "../types";
import { staggerContainer, fadeInUp } from "../utils/animations";

interface SidebarProps {
  properties: Property[];
  selectedPropertyId: string;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  handlePropertyChange: (id: string) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isPropertyDropdownOpen: boolean;
  setIsPropertyDropdownOpen: (open: boolean) => void;
  selectedProperty: Property;
  entryCount: number;
  currentLanguage: "en" | "sw";
  unreadNotifications?: number;
  userIsAdmin?: boolean;
  userIsFacilityManager?: boolean;
  userIsOwner?: boolean;
}

export default function Sidebar({
  properties,
  selectedPropertyId,
  activeTab,
  setActiveTab,
  handlePropertyChange,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  isPropertyDropdownOpen,
  setIsPropertyDropdownOpen,
  selectedProperty,
  entryCount,
  currentLanguage,
  unreadNotifications = 0,
  userIsAdmin = false,
  userIsFacilityManager = false,
  userIsOwner = false
}: SidebarProps) {

  const isEn = currentLanguage === "en";

  const t = {
    financialHeader: isEn ? "System Navigation" : "Urambazaji wa Mfumo",
    tipHeader: isEn ? "TCO Planning Insight" : "Kidokezo cha Upangaji TCO",
    tipBody: isEn
      ? "Estimating Total Cost of Ownership (TCO) helps eliminate 'first-cost bias', saving developers over 35% in long-term building operations."
      : "Kukadiria Gharama ya Jumla ya Umiliki (TCO) husaidia kuondoa upendeleo wa gharama ya kwanza, na kuokoa hadi 35% ya gharama za uendeshaji."
  };

  const navItems: { tab: ActiveTabType; label: string; icon: any; color: string; badge?: number; adminOnly?: boolean; fmOnly?: boolean; ownerOnly?: boolean; ownerVisible?: boolean }[] = [
    { tab: "dashboard", label: "Dashboard", icon: Activity, color: "text-emerald-400", ownerVisible: true },
    { tab: "admin-dashboard", label: "Admin Dashboard", icon: LayoutDashboard, color: "text-emerald-400", adminOnly: true },
    { tab: "facility-dashboard", label: "Facility Dashboard", icon: LayoutDashboard, color: "text-sky-400", fmOnly: true },
    { tab: "owner-dashboard", label: "Owner Dashboard", icon: Crown, color: "text-amber-400", ownerOnly: true },
    { tab: "properties-mgmt", label: "Projects", icon: Building, color: "text-emerald-500", badge: properties.filter(p => !p.isSoftDeleted).length, ownerVisible: true },
    { tab: "cost-estimation", label: "Cost Estimation", icon: Cpu, color: "text-cyan-400" },
    { tab: "vendors", label: "Vendors & Materials", icon: Users, color: "text-amber-400" },
    { tab: "assets", label: "Asset Management", icon: Boxes, color: "text-blue-400" },
    { tab: "maintenance", label: "Maintenance", icon: Wrench, color: "text-orange-400" },
    { tab: "ai-predictions", label: "AI Insights", icon: Sparkles, color: "text-violet-400", ownerVisible: true },
    { tab: "sustainability", label: "Sustainability", icon: Leaf, color: "text-green-400", ownerVisible: true },
    { tab: "compliance", label: "Compliance", icon: ShieldCheck, color: "text-teal-400" },
    { tab: "reports", label: "Reports", icon: FileText, color: "text-sky-400", ownerVisible: true },
    { tab: "notifications", label: "Notifications", icon: Bell, color: "text-rose-400", badge: unreadNotifications, ownerVisible: true },
    { tab: "user-management", label: "User Management", icon: UserCog, color: "text-indigo-400", adminOnly: true },
    { tab: "system-settings", label: "System Settings", icon: Settings, color: "text-slate-400", adminOnly: true },
  ];

  const visibleNavItems = navItems.filter(item => {
    // Owner role: only show ownerVisible + ownerOnly items
    if (userIsOwner) {
      return item.ownerOnly || item.ownerVisible;
    }
    // Admin/FM/other roles: hide ownerOnly items
    if (item.ownerOnly) return false;
    if (item.adminOnly && !userIsAdmin) return false;
    if (item.fmOnly && !userIsFacilityManager) return false;
    if (item.tab === "dashboard" && (userIsAdmin || userIsFacilityManager)) return false;
    return true;
  });

  return (
    <aside
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 border-r border-slate-900 transform ${
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
    >
      {/* Sidebar Header with BLCTS Shield */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-900/80 bg-slate-950 select-none shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-[0_2px_10px_rgba(16,185,129,0.2)]">
            B
          </div>
          <div>
            <span className="text-white font-display font-medium text-sm tracking-wide block">BLCTS Portal</span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block leading-tight">Lifecycle Costs</span>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Current Project Card */}
      <div className="p-4 border-b border-slate-900 bg-slate-950 shrink-0 text-left">
        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-2 select-none">
          Current Project
        </span>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-start gap-2">
            <Building className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-white block truncate leading-snug">
                {selectedProperty.name}
              </span>
              <span className="text-[10px] text-slate-400 block truncate font-light mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{selectedProperty.location}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/60">
            <span className="text-slate-500">Status</span>
            <span className="font-mono font-bold text-emerald-400">{selectedProperty.status || "Active"}</span>
          </div>
          <button
            onClick={() => { setActiveTab("properties-mgmt"); setIsMobileSidebarOpen(false); }}
            className="w-full mt-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] uppercase tracking-wider font-bold py-1.5 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all cursor-pointer text-center block"
          >
            Change Project
          </button>
        </div>
      </div>

      {/* CORE NAVIGATION LINKS */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-none"
      >

        <span className="text-[9px] uppercase font-bold text-slate-500 px-3 tracking-wide select-none block pb-1">
          {t.financialHeader}
        </span>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.tab}
              variants={fadeInUp}
              whileHover={{ x: 3, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveTab(item.tab); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer relative overflow-hidden ${
                activeTab === item.tab
                  ? "bg-slate-900 text-white font-extrabold"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40"
              }`}
            >
              {activeTab === item.tab && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <div className="flex items-center gap-2.5">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${activeTab === item.tab ? "text-emerald-400" : item.color}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black border ${
                    item.tab === "notifications"
                      ? "bg-rose-950 text-rose-400 border-rose-900"
                      : "bg-emerald-950 text-emerald-400 border-emerald-900"
                  }`}>
                  {item.badge}
                </motion.span>
              )}
            </motion.button>
          );
        })}

      </motion.div>

      {/* Education Box */}
      <div className="p-3.5 mx-3 mb-3 bg-[#0a0f1d] border border-slate-900 rounded-xl shrink-0 select-none text-left">
        <h5 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">
          {t.tipHeader}
        </h5>
        <p className="text-[10px] text-slate-500 leading-relaxed font-light">
          {t.tipBody}
        </p>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/40 flex items-center justify-between text-[9px] text-slate-500 font-mono shrink-0 select-none">
        <span>BLCTS Portal</span>
        <span>v3.0.0</span>
      </div>
    </aside>
  );
}
