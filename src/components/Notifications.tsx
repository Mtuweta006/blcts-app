import React, { useState, useEffect, useMemo } from "react";
import { Bell, Wrench, Coins, FileText, Shield, Sparkles, ShieldCheck, TriangleAlert as AlertTriangle, CheckCheck, Check, ListFilter as Filter, Search, Clock, Inbox } from "lucide-react";
import { AppNotification } from "../types";

interface NotificationsProps {
  notifications: AppNotification[];
  selectedPropertyId: string;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
}

const STORAGE_KEY = "blcts-notifications";

const NOTIFICATION_TYPES: AppNotification["type"][] = [
  "maintenance",
  "budget",
  "contract",
  "warranty",
  "ai_recommendation",
  "compliance",
  "equipment",
];

const SEVERITIES: AppNotification["severity"][] = [
  "low",
  "medium",
  "high",
  "critical",
];

const TYPE_META: Record<
  AppNotification["type"],
  { icon: React.ElementType; label: string; badge: string }
> = {
  maintenance: {
    icon: Wrench,
    label: "Maintenance",
    badge:
      "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900/50",
  },
  budget: {
    icon: Coins,
    label: "Budget",
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  },
  contract: {
    icon: FileText,
    label: "Contract",
    badge:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  warranty: {
    icon: Shield,
    label: "Warranty",
    badge:
      "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-900/50",
  },
  ai_recommendation: {
    icon: Sparkles,
    label: "AI Recommendation",
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  },
  compliance: {
    icon: ShieldCheck,
    label: "Compliance",
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  },
  equipment: {
    icon: AlertTriangle,
    label: "Equipment",
    badge:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
  },
};

const SEVERITY_META: Record<
  AppNotification["severity"],
  { badge: string; dot: string; label: string }
> = {
  low: {
    badge:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    label: "Low",
  },
  medium: {
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
    label: "Medium",
  },
  high: {
    badge:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
    dot: "bg-orange-500",
    label: "High",
  },
  critical: {
    badge:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-500",
    label: "Critical",
  },
};

const formatRelativeTime = (timestamp: string): string => {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return timestamp;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 5) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function Notifications({
  notifications,
  selectedPropertyId,
  triggerToast,
}: NotificationsProps) {
  const [readState, setReadState] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [readFilter, setReadFilter] = useState<string>("All");

  // Load persisted read state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setReadState(parsed);
        }
      }
    } catch (err) {
          }
  }, []);

  // Persist read state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readState));
    } catch (err) {
          }
  }, [readState]);

  // Resolve effective read status: persisted state overrides prop isRead
  const resolvedNotifications = useMemo(
    () =>
      notifications.map((n) => ({
        ...n,
        isRead: readState.hasOwnProperty(n.id) ? readState[n.id] : n.isRead,
      })),
    [notifications, readState]
  );

  // Filter by selected property (also include notifications without propertyId)
  const propertyNotifications = useMemo(
    () =>
      resolvedNotifications.filter(
        (n) => !n.propertyId || n.propertyId === selectedPropertyId
      ),
    [resolvedNotifications, selectedPropertyId]
  );

  // Summary metrics
  const summary = useMemo(() => {
    const total = propertyNotifications.length;
    const unread = propertyNotifications.filter((n) => !n.isRead).length;
    const critical = propertyNotifications.filter(
      (n) => n.severity === "critical"
    ).length;
    const high = propertyNotifications.filter(
      (n) => n.severity === "high"
    ).length;
    return { total, unread, critical, high };
  }, [propertyNotifications]);

  // Apply search + type + severity + read filters
  const visibleNotifications = useMemo(() => {
    let list = propertyNotifications;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "All") {
      list = list.filter((n) => n.type === typeFilter);
    }

    if (severityFilter !== "All") {
      list = list.filter((n) => n.severity === severityFilter);
    }

    if (readFilter === "Unread") {
      list = list.filter((n) => !n.isRead);
    } else if (readFilter === "Read") {
      list = list.filter((n) => n.isRead);
    }

    // Sort: unread first, then by timestamp descending (most recent first)
    const sorted = [...list].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return (
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });
    return sorted;
  }, [propertyNotifications, searchQuery, typeFilter, severityFilter, readFilter]);

  const handleMarkAsRead = (id: string) => {
    setReadState((prev) => {
      if (prev[id]) return prev; // already read, no-op
      return { ...prev, [id]: true };
    });
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = propertyNotifications
      .filter((n) => !n.isRead)
      .map((n) => n.id);
    if (unreadIds.length === 0) {
      triggerToast("All notifications are already read.", "info");
      return;
    }
    setReadState((prev) => {
      const next = { ...prev };
      for (const id of unreadIds) next[id] = true;
      return next;
    });
    triggerToast(
      `Marked ${unreadIds.length} notification${unreadIds.length > 1 ? "s" : ""} as read.`,
      "success"
    );
  };

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.isRead) handleMarkAsRead(n.id);
  };

  const summaryCards = [
    {
      label: "Total Notifications",
      value: summary.total,
      icon: Bell,
      color:
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
    },
    {
      label: "Unread",
      value: summary.unread,
      icon: Inbox,
      color:
        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Critical",
      value: summary.critical,
      icon: AlertTriangle,
      color: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
    },
    {
      label: "High",
      value: summary.high,
      icon: AlertTriangle,
      color:
        "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="space-y-8 text-left animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Notifications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track maintenance alerts, budget warnings, contract updates,
            warranty expirations, AI recommendations, compliance reminders, and
            equipment notices.
          </p>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      {/* TOOLBAR: search + filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, message, or type..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">All Types</option>
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">All Severities</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      {visibleNotifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Bell className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No notifications found
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-light">
            {propertyNotifications.length === 0
              ? "This property has no notifications. New alerts for maintenance, budgets, contracts, and compliance will appear here."
              : "No notifications match your current search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((n) => {
            const typeMeta = TYPE_META[n.type];
            const sevMeta = SEVERITY_META[n.severity];
            const TypeIcon = typeMeta.icon;

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.01)] transition-all cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700/60 ${
                  n.isRead
                    ? "border-slate-200/60 dark:border-slate-800"
                    : "border-emerald-200 dark:border-emerald-900/50 ring-1 ring-emerald-100 dark:ring-emerald-950/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Type icon */}
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${typeMeta.badge} border`}
                  >
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-sm truncate ${
                              n.isRead
                                ? "font-semibold text-slate-700 dark:text-slate-300"
                                : "font-bold text-slate-900 dark:text-white"
                            }`}
                          >
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-light mt-1">
                          {n.message}
                        </p>
                      </div>

                      {/* Mark as Read button */}
                      {!n.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(n.id);
                          }}
                          className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          Mark as Read
                        </button>
                      )}
                    </div>

                    {/* Badges + timestamp */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${typeMeta.badge}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {typeMeta.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${sevMeta.badge}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${sevMeta.dot}`}
                        />
                        {sevMeta.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(n.timestamp)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          n.isRead
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {n.isRead ? "Read" : "Unread"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
