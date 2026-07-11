import React from "react";
import { CircleCheck, Circle, CircleDot, ArrowRight, ChevronRight } from "lucide-react";

export interface WorkflowStep {
  label: string;
  status: "completed" | "active" | "pending";
  icon?: React.ReactNode;
}

export function WorkflowStepper({ steps, className = "" }: { steps: WorkflowStep[]; className?: string }) {
  return (
    <div className={`flex items-center gap-1 overflow-x-auto pb-2 ${className}`}>
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
            step.status === "completed"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40"
              : step.status === "active"
              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 animate-pulse"
              : "bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border border-slate-100 dark:border-slate-800"
          }`}>
            {step.status === "completed" ? (
              <CircleCheck className="w-3.5 h-3.5 shrink-0" />
            ) : step.status === "active" ? (
              <CircleDot className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="whitespace-nowrap">{step.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function WorkflowTimeline({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-start gap-3 relative">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
              step.status === "completed"
                ? "bg-emerald-500 text-white"
                : step.status === "active"
                ? "bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-950/40"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400"
            }`}>
              {step.status === "completed" ? (
                <CircleCheck className="w-4 h-4" />
              ) : step.status === "active" ? (
                <CircleDot className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-0.5 h-8 ${step.status === "completed" ? "bg-emerald-300 dark:bg-emerald-800" : "bg-slate-100 dark:bg-slate-800"}`} />
            )}
          </div>
          <div className="pt-1 pb-2">
            <span className={`text-xs font-bold ${
              step.status === "completed"
                ? "text-slate-700 dark:text-slate-300"
                : step.status === "active"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-400 dark:text-slate-600"
            }`}>
              {step.label}
            </span>
            {step.status === "active" && (
              <span className="block text-[9px] text-blue-500 font-medium mt-0.5 uppercase tracking-wider">In Progress</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ status, color }: { status: string; color?: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
    red: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40",
    gray: "bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800",
    violet: "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/40",
  };

  const cls = colorMap[color || "gray"] || colorMap.gray;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
}

export function ProgressBar({ value, max = 100, label, color = "emerald" }: { value: number; max?: number; label?: string; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
  };
  const barColor = colorMap[color] || colorMap.emerald;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
          <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-500 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />}
          {item.onClick ? (
            <button onClick={item.onClick} className="hover:text-emerald-500 transition-colors cursor-pointer">
              {item.label}
            </button>
          ) : (
            <span className="text-slate-600 dark:text-slate-300 font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function NextStepGuide({ currentStep, nextStep, onNext, nextLabel }: {
  currentStep: string;
  nextStep: string;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/20 dark:to-emerald-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl p-3">
      <div className="flex items-center gap-2">
        <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Step</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentStep}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 mx-1" />
        <div>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Next Step</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{nextStep}</span>
        </div>
      </div>
      {onNext && (
        <button
          onClick={onNext}
          className="bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <ArrowRight className="w-3 h-3" />
          {nextLabel || "Continue"}
        </button>
      )}
    </div>
  );
}

export function WorkflowChecklist({ items }: { items: { label: string; done: boolean; onClick?: () => void }[] }) {
  const completedCount = items.filter(i => i.done).length;
  const pct = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Project Workflow Progress</span>
        <span className="text-xs font-mono font-bold text-emerald-500">{completedCount}/{items.length}</span>
      </div>
      <ProgressBar value={pct} color="emerald" />
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors ${
            item.done ? "bg-emerald-50/50 dark:bg-emerald-950/20" : "bg-slate-50 dark:bg-slate-900/40"
          } ${item.onClick ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" : ""}`}
            onClick={item.onClick}
          >
            {item.done ? (
              <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-700 shrink-0" />
            )}
            <span className={`text-xs font-medium ${
              item.done ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"
            }`}>
              {item.label}
            </span>
            {item.done && item.onClick && (
              <ArrowRight className="w-3 h-3 text-emerald-400 ml-auto" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
