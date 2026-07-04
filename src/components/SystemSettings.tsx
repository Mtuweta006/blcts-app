import React, { useState } from "react";
import { Settings, ShieldCheck, Bell, Cpu, History, Save } from "lucide-react";
import { SystemSettings } from "../types";

interface SystemSettingsProps {
  systemSettings: SystemSettings;
  onSafetyMarginChange: (margin: number) => void;
  onUpdateSettings: (updates: Partial<SystemSettings>) => void;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
}

export default function SystemSettingsPanel({
  systemSettings, onSafetyMarginChange, onUpdateSettings, triggerToast
}: SystemSettingsProps) {
  const [localMargin, setLocalMargin] = useState(systemSettings.safetyMargin);
  const [aiModel, setAiModel] = useState(systemSettings.aiModel);
  const [channels, setChannels] = useState(systemSettings.notificationChannels);

  const handleSaveMargin = () => {
    onSafetyMarginChange(localMargin);
  };

  const handleSaveAiModel = () => {
    onUpdateSettings({ aiModel });
    triggerToast(`AI model updated to ${aiModel}`, "success");
  };

  const handleChannelToggle = (channel: keyof typeof channels) => {
    const updated = { ...channels, [channel]: !channels[channel] };
    setChannels(updated);
    onUpdateSettings({ notificationChannels: updated });
    triggerToast(`${channel} notifications ${updated[channel] ? "enabled" : "disabled"}`, "info");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-500" />
          System Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure platform-wide safety margins, AI models, and notification preferences.
        </p>
      </div>

      {/* Safety Margin Configuration */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Safety Margin (Loss Prevention)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
          The safety margin is automatically added to every base unit price before cost calculations. This ensures a buffer against price fluctuations and prevents budget underestimation.
        </p>

        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Current Safety Margin</span>
            <span className="text-2xl font-mono font-black text-emerald-500">KSh {localMargin}</span>
          </div>

          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={localMargin}
              onChange={e => setLocalMargin(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>KSh 0</span>
              <span>KSh 20 (Default)</span>
              <span>KSh 100</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Example: Cement (Nairobi)</span>
              <span className="font-mono text-slate-400">Base: KSh 850</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Safety Margin</span>
              <span className="font-mono text-amber-500">+ KSh {localMargin}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">Final Price</span>
              <span className="font-mono font-bold text-emerald-500">KSh {850 + localMargin}</span>
            </div>
          </div>

          <button
            onClick={handleSaveMargin}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Safety Margin
          </button>
        </div>
      </div>

      {/* AI Model Configuration */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-violet-400" />
          AI Model Configuration
        </h3>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Active AI Model</label>
          <select
            value={aiModel}
            onChange={e => setAiModel(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Balanced)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Accurate)</option>
          </select>
          <p className="text-[10px] text-slate-400 font-light">
            The selected AI model powers cost estimation, plan analysis, and completion forecasting.
          </p>
          <button
            onClick={handleSaveAiModel}
            className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save AI Model
          </button>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          Notification Channels
        </h3>
        <div className="space-y-3">
          {([
            { key: "inApp" as const, label: "In-App Notifications", desc: "Show notifications within the platform interface" },
            { key: "email" as const, label: "Email Notifications", desc: "Send alerts to user email addresses" },
            { key: "sms" as const, label: "SMS Notifications", desc: "Send critical alerts via SMS (M-Pesa integration)" }
          ]).map(ch => (
            <div key={ch.key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{ch.label}</span>
                <span className="text-[10px] text-slate-400 block">{ch.desc}</span>
              </div>
              <button
                onClick={() => handleChannelToggle(ch.key)}
                className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                  channels[ch.key] ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-800"
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  channels[ch.key] ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Viewer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          Audit Log
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {systemSettings.auditLogs.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                {log.userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.userName}</span>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{log.role}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">{log.action}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{log.details}</span>
                <span className="text-[9px] text-slate-400 font-mono block">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
