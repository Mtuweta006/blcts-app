import React, { useState } from "react";
import { 
  Building2, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Briefcase, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Crown
} from "lucide-react";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  isDarkMode: boolean;
}

export default function AuthScreen({ onLoginSuccess, isDarkMode }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"Developer" | "Facility Manager" | "Building Owner">("Developer");
  const [organization, setOrganization] = useState("Wandera Investments Ltd");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simulation states
  const [authStatus, setAuthStatus] = useState<"idle" | "verifying" | "syncing_sensor" | "finalizing" | "success">("idle");
  const [syncMessage, setSyncMessage] = useState("");
 
  const handleQuickLogin = (preset: "admin" | "manager" | "owner") => {
    setError(null);
    if (preset === "admin") {
      setEmail("admin@blcts.com");
      setPassword("adminPass123");
      setName("Abdulwahab Wandera");
      setRole("Developer");
      setOrganization("Wandera Investments Ltd");
      setPhone("+254 712 345 678");
    } else if (preset === "manager") {
      setEmail("manager@blcts.com");
      setPassword("managerPass99");
      setName("Kamau Njoroge");
      setRole("Facility Manager");
      setOrganization("Thika Block Management");
      setPhone("+254 722 987 654");
    } else if (preset === "owner") {
      setEmail("owner@blcts.com");
      setPassword("ownerPass77");
      setName("Aisha Mohamed");
      setRole("Building Owner");
      setOrganization("Mohamed Development Group");
      setPhone("+254 733 123 456");
    }
    // Select login tab automatically
    setActiveTab("login");
  };

  // Initialize standard user accounts with SHA-256 secure hashes on mount
  React.useEffect(() => {
    const defaultUsers = [
      {
        id: "user-admin",
        email: "admin@blcts.com",
        name: "Abdulwahab Wandera",
        role: "Developer",
        organization: "Wandera Investments Ltd",
        phone: "+254 712 345 678",
        passwordHash: "4b971cafd7903d148bda8f8aa7faa57b769cded513ecb31e124d1e010a80555f" // SHA-256 of "adminPass123"
      },
      {
        id: "user-manager",
        email: "manager@blcts.com",
        name: "Kamau Njoroge",
        role: "Facility Manager",
        organization: "Thika Block Management",
        phone: "+254 722 987 654",
        passwordHash: "276cbf1e0dd8b5d1bd515780206dfbf0257d379494feefee8503f2d85e9a7c2a" // SHA-256 of "managerPass99"
      },
      {
        id: "user-owner",
        email: "owner@blcts.com",
        name: "Aisha Mohamed",
        role: "Building Owner",
        organization: "Mohamed Development Group",
        phone: "+254 733 123 456",
        passwordHash: "29cf5c7634755973d2646d902a6a46ffd64d5cc3d3d91096d80811a2beee7b15" // SHA-256 of "ownerPass77"
      },
      {
        id: "user-engineer",
        email: "lead.engineer@davis-shirtliff.co.ke",
        name: "Jane Atieno",
        role: "Maintenance Engineer",
        organization: "Davis & Shirtliff Tech",
        phone: "+254 733 445 566",
        passwordHash: "02f0cdcbe300c5a93067cecb66b1aa7a78834a5af425c02f73b636f7745433fc" // SHA-256 of "engineerPass22"
      }
    ];
    const stored = localStorage.getItem("blcts-users");
    if (!stored) {
      localStorage.setItem("blcts-users", JSON.stringify(defaultUsers));
    } else {
      // Merge: ensure demo accounts always exist with correct credentials
      try {
        const existing = JSON.parse(stored);
        const merged = [...existing];
        for (const demo of defaultUsers) {
          const idx = merged.findIndex((u: any) => u.id === demo.id || u.email === demo.email);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...demo };
          } else {
            merged.push(demo);
          }
        }
        localStorage.setItem("blcts-users", JSON.stringify(merged));
      } catch {
        localStorage.setItem("blcts-users", JSON.stringify(defaultUsers));
      }
    }
  }, []);

  // Secure SHA-256 cryptographic hashing helper
  const hashPassword = async (pwd: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const executeAuthSimulation = (userPayload: User) => {
    setAuthStatus("verifying");
    setSyncMessage("Authenticating credentials & establishing session...");
    
    setTimeout(() => {
      setAuthStatus("syncing_sensor");
      setSyncMessage("Synchronizing local building IoT sensors and thermal logs...");
    }, 1200);

    setTimeout(() => {
      setAuthStatus("finalizing");
      setSyncMessage("Establishing secure Daraja M-PESA sandbox gateway...");
    }, 2400);

    setTimeout(() => {
      setAuthStatus("success");
      setSyncMessage("Verification complete. Redirecting you to the asset deck...");
      setTimeout(() => {
        onLoginSuccess(userPayload);
      }, 700);
    }, 3500);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all standard credential fields.");
      return;
    }

    try {
      const hashedInput = await hashPassword(password);
      const storedUsersJson = localStorage.getItem("blcts-users");
      const storedUsers = storedUsersJson ? JSON.parse(storedUsersJson) : [];

      const matchedUser = storedUsers.find(
        (u: any) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
      );

      if (!matchedUser) {
        setError("Account not found. Please register as a Developer or Facility Manager.");
        return;
      }

      if (matchedUser.passwordHash !== hashedInput) {
        setError("Invalid secret passcode. Access denied.");
        return;
      }

      const userPayload: User = {
        id: matchedUser.id || `user-${Date.now()}`,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        organization: matchedUser.organization,
        phone: matchedUser.phone
      };

      executeAuthSimulation(userPayload);
    } catch (err) {
      setError("System encryption error during verification.");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !name) {
      setError("Please fill in Name, Email, and Password.");
      return;
    }

    if (password.length < 6) {
      setError("For proper security, passwords require at least 6 characters.");
      return;
    }

    try {
      const storedUsersJson = localStorage.getItem("blcts-users");
      const storedUsers = storedUsersJson ? JSON.parse(storedUsersJson) : [];

      const userExists = storedUsers.some(
        (u: any) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
      );

      if (userExists) {
        setError("This email address is already registered in BLCTS.");
        return;
      }

      const passwordHash = await hashPassword(password);
      const newRegisteredUser = {
        id: `user-${Date.now()}`,
        name,
        email: email.toLowerCase().trim(),
        role,
        organization: organization || "Municipal Land Management",
        phone: phone || "+254 700 000 000",
        passwordHash
      };

      const updatedUsers = [...storedUsers, newRegisteredUser];
      localStorage.setItem("blcts-users", JSON.stringify(updatedUsers));

      const userPayload: User = {
        id: newRegisteredUser.id,
        name: newRegisteredUser.name,
        email: newRegisteredUser.email,
        role: newRegisteredUser.role as any,
        organization: newRegisteredUser.organization,
        phone: newRegisteredUser.phone
      };

      executeAuthSimulation(userPayload);
    } catch (err) {
      setError("System encryption error during registration.");
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200 ${
      isDarkMode ? "bg-slate-950 text-slate-105" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Dynamic Background visual ornaments */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[70%] rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-tr from-sky-500/10 to-transparent blur-[125px] pointer-events-none" />
      <div className="absolute -inset-0 bg-[linear-gradient(to_right,#1e293b0e_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0e_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#0f172a55_1px,transparent_1px),linear-gradient(to_bottom,#0f172a55_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Brand presentation card */}
        <div className="lg:col-span-5 space-y-6 text-left hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 p-3 rounded-2xl border border-emerald-400/20 shadow-lg text-slate-950">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-emerald-500 tracking-widest block font-display">
                Enterprise Suite
              </span>
              <h1 className="text-xl font-black text-slate-950 dark:text-white font-display tracking-tight leading-none mt-1">
                BLCTS PORTAL
              </h1>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight leading-snug">
              Maximize Asset Integrity, Eliminate First-Cost Bias
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Nairobi&apos;s leading platform optimizing commercial building structures. Forecast 25-Year cumulative material wear, track active solar utility yields, and streamline mobile contractor payouts securely.
            </p>
          </div>

          {/* Core Feature bullet outline */}
          <div className="space-y-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-emerald-500/10 text-emerald-400 p-1 rounded-lg border border-emerald-500/10 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-display">
                  Live IoT Telemetry Loop
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5 leading-snug">
                  Continuously streams temperature, power factor, pressure anomalies, and vibration offsets.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-sky-500/10 text-sky-400 p-1 rounded-lg border border-sky-500/10 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-display">
                  TCO Forecast Engine
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Visualizes actual cumulative outlays across a 30-year operational horizon in beautiful charts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-amber-500/10 text-amber-500 p-1 rounded-lg border border-amber-500/10 shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-display">
                  Safaricom Daraja API Sync
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Execute instant contractor M-Pesa payouts directly inside the maintenance log hub.
                </p>
              </div>
            </div>
          </div>

          {/* Quick-select profiles banner info */}
          <div className="p-3 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 leading-normal">
              Select a preset account on the right to quickly access the platform.
            </span>
          </div>
        </div>

        {/* Right Side: Responsive Auth Card panel */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-[0_15px_60px_-15px_rgba(0,0,0,0.1)] p-6 sm:p-8 relative">
          
          {/* Logo flag for mobile */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 p-2 rounded-xl text-slate-950">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm font-display uppercase tracking-widest text-slate-900 dark:text-white">
              BLCTS Portal
            </span>
          </div>

          <AnimatePresence mode="wait">
            {authStatus === "idle" ? (
              <motion.div
                key="auth-form-content"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Form Navigation Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl font-bold">
                  <button
                    onClick={() => { setActiveTab("login"); setError(null); }}
                    className={`flex-1 py-2 text-xs rounded-lg transition-all cursor-pointer ${
                      activeTab === "login"
                        ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-emerald-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setActiveTab("signup"); setError(null); }}
                    className={`flex-1 py-2 text-xs rounded-lg transition-all cursor-pointer ${
                      activeTab === "signup"
                        ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-emerald-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    Register Account
                  </button>
                </div>

                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight font-display">
                    {activeTab === "login" ? "Welcome Back to BLCTS" : "Create Enterprise Account"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">
                    {activeTab === "login" 
                      ? "Sign in to review asset durability metrics and invoice registers" 
                      : "Register to manage municipalities structure catalogs and logs"
                    }
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-rose-950/20 border border-red-200 dark:border-rose-900/40 text-red-800 dark:text-rose-350 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
                    <span className="shrink-0">•</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submitting Forms */}
                <form onSubmit={activeTab === "login" ? handleLoginSubmit : handleSignupSubmit} className="space-y-4 text-left">
                  
                  {activeTab === "signup" && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-display">
                        Full Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Abdulwahab Wandera"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 pl-10 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 caret-slate-900 dark:caret-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                        />
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-display">
                      Work Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="e.g. wanderaabdulwahab4@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 pl-10 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 caret-slate-900 dark:caret-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Standard details for user customization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-display">
                        System Role Profile *
                      </label>
                      <div className="relative">
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 pl-10 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 caret-slate-900 dark:caret-slate-100 font-semibold cursor-pointer appearance-none"
                        >
                          <option value="Developer">Administrator</option>
                          <option value="Facility Manager">Facility Manager</option>
                          <option value="Building Owner">Building Owner / Developer</option>
                        </select>
                        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-display">
                        Mobile Money Contact (KES Draw)
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="e.g. +254 712 345 678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 pl-10 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 caret-slate-900 dark:caret-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-display">
                      Corporate Organization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wandera Investments Ltd"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 caret-slate-900 dark:caret-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-display">
                        Secret Password *
                      </label>
                      {activeTab === "login" && (
                        <button type="button" className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold hover:underline">
                          Forgot passcode?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 pl-10 pr-10 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 caret-slate-900 dark:caret-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-350 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 flex items-center justify-center gap-2 mt-6 cursor-pointer transform active:scale-95"
                  >
                    <span>{activeTab === "login" ? "Verify Credentials" : "Initialize Infrastructure Profile"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick login preset triggers */}
                <div className="border-t border-slate-150 dark:border-slate-800/80 pt-5 space-y-3">
                  <div className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider text-center font-display">
                    Quick Access
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin("admin")}
                      className="border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl text-left transition-all hover:bg-white dark:hover:bg-slate-900 group cursor-pointer"
                    >
                      <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Administrator</div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-400 mt-0.5">System Administrator</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">admin@blcts.com</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin("manager")}
                      className="border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl text-left transition-all hover:bg-white dark:hover:bg-slate-900 group cursor-pointer"
                    >
                      <div className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">Kamau Njoroge</div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-sky-400 mt-0.5">Facility Manager</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">manager@blcts.com</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin("owner")}
                      className="border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl text-left transition-all hover:bg-white dark:hover:bg-slate-900 group cursor-pointer sm:col-span-2"
                    >
                      <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Building Owner</div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-400 mt-0.5">Aisha Mohamed</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">owner@blcts.com</div>
                    </button>
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="auth-sync-simulation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-6"
              >
                {/* Advanced Sync Circle indicator */}
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-20 w-20 rounded-full bg-emerald-500/10 animate-pulse border border-emerald-500/20" />
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-emerald-400 shadow-xl relative z-10">
                    <Cpu className="w-10 h-10 animate-spin" style={{ animationDuration: "3s" }} />
                  </div>
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-500 font-display">
                    Secure Handshake Sequence
                  </h3>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    Initializing Infrastructure Console...
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono px-4 h-10">
                    {syncMessage}
                  </p>
                </div>

                {/* Loading bar */}
                <div className="w-48 bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-900">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                    style={{ 
                      width: 
                        authStatus === "verifying" ? "33%" : 
                        authStatus === "syncing_sensor" ? "66%" : 
                        authStatus === "finalizing" ? "90%" : "100%" 
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
