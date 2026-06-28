import React from "react";
import { Building2, ArrowRight, Lock, Database, CloudUpload as UploadCloud, Cpu, Coins, ChartBar as BarChart3, Sparkles, FolderOpen, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onEnterApp: () => void;
  onEnterAuth: (tab: "login" | "signup") => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function LandingPage({ 
  onEnterApp, 
  onEnterAuth, 
  isDarkMode, 
  toggleDarkMode 
}: LandingPageProps) {

  const workflowSteps = [
    { 
      step: "01",
      title: "Secure Login", 
      desc: "Authenticate via secure accounts customized for Developers or Facility Managers." 
    },
    { 
      step: "02",
      title: "Create Project", 
      desc: "Define structural details, expected lifecycle, target location, and floor area metrics." 
    },
    { 
      step: "03",
      title: "Upload Plan", 
      desc: "Securely upload architectural blueprints (PDF, JPG, PNG) and associate them with your project files." 
    },
    { 
      step: "04",
      title: "AI Cost Estimation", 
      desc: "The AI parsing engine analyzes parameters and estimates structural, material, and labor baseline costs." 
    },
    { 
      step: "05",
      title: "TCO Calculation", 
      desc: "The system dynamically calculates the Total Cost of Ownership (CAPEX + 30-year operational OPEX)." 
    },
    { 
      step: "06",
      title: "Reports & Insights", 
      desc: "Visualize detailed expenditure trends, material price correlations, and AI predictive insights." 
    }
  ];

  const keyFeatures = [
    {
      icon: <Lock className="w-6 h-6 text-indigo-500" />,
      title: "Secure Authentication",
      desc: "Role-based system authorization restricting access to verified project developers and operational facility managers."
    },
    {
      icon: <FolderOpen className="w-6 h-6 text-blue-500" />,
      title: "Project Management",
      desc: "Comprehensive CRUD module to catalog, edit, and keep track of individual building developments over their lifespans."
    },
    {
      icon: <UploadCloud className="w-6 h-6 text-sky-500" />,
      title: "Architectural Plan Upload",
      desc: "Direct integration for linking digital structural designs and floor plans directly to the active project context."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-500" />,
      title: "AI Cost Estimation",
      desc: "Intelligent neural algorithms that parse floor areas and building designs to produce hyper-accurate material estimations."
    },
    {
      icon: <Database className="w-6 h-6 text-emerald-500" />,
      title: "Material Price Database",
      desc: "A fully manageable ledger tracking current cement, steel, waterproofing, and HVAC system component prices."
    },
    {
      icon: <Coins className="w-6 h-6 text-violet-500" />,
      title: "Total Cost of Ownership (TCO)",
      desc: "Avoid the first-cost bias by projecting the cumulative burden of utilities, maintenance, and structural upkeep."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-rose-500" />,
      title: "Reports & Interactive Charts",
      desc: "Stunning analytical visualizations highlighting monthly expenditure patterns, cost trends, and material splits."
    },
    {
      icon: <Cpu className="w-6 h-6 text-teal-500" />,
      title: "AI Analytics",
      desc: "Predictive lifespan forecasting, budget anomaly detection, and automated lifecycle preventative maintenance suggestions."
    }
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`} id="blcts-landing">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 bg-white/75 dark:bg-slate-950/75 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Building2 className="w-5 h-5" id="nav-logo" />
            </div>
            <span className="font-extrabold tracking-tight text-sm uppercase">
              BLCTS <span className="text-indigo-600 dark:text-indigo-400">Portal</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
              aria-label="Toggle Theme"
              id="theme-toggle-btn"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              onClick={() => onEnterAuth("login")}
              className="text-xs font-semibold px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
              id="nav-login-btn"
            >
              Sign In
            </button>

            <button
              onClick={() => onEnterAuth("signup")}
              className="text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition"
              id="nav-signup-btn"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-28" id="hero-section">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-slate-950 dark:text-white max-w-4xl mx-auto"
            id="hero-heading"
          >
            Building Lifecycle <br />
            <span className="text-indigo-600 dark:text-indigo-400">Cost Tracking System</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light leading-relaxed"
            id="hero-subtitle"
          >
            An AI-driven decision-support platform designed to mitigate "first-cost bias". 
            Compare capital development expenditure with 30-year operational projections 
            using real material prices.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            id="hero-actions"
          >
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              id="hero-primary-btn"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onEnterAuth("login")}
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition"
              id="hero-secondary-btn"
            >
              Sign In
            </button>
          </motion.div>
        </div>

        {/* Dynamic Abstract Background Glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 translate-x-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* ABOUT THE SYSTEM */}
      <section className="py-16 border-t border-slate-200/60 dark:border-slate-900 bg-white dark:bg-slate-950/40" id="about-section">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400">
            About the System
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Why Track the Building Lifecycle?
          </h3>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-3xl mx-auto">
            Up to <strong>80%</strong> of a building's total cost is incurred during its operational lifetime, 
            yet developers frequently focus solely on initial capital expenditure (CAPEX). 
            The <strong>Building Lifecycle Cost Tracking System (BLCTS)</strong> bridges this gap. 
            By integrating an active construction material price database, architectural plan reference management, and 
            robust AI calculations, BLCTS exposes long-term maintenance costs and utility consumption anomalies 
            before ground is ever broken.
          </p>
        </div>
      </section>

      {/* HOW THE SYSTEM WORKS */}
      <section className="py-20 border-t border-slate-200/60 dark:border-slate-900" id="workflow-section">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 animate-pulse">
              Intuitive Workflow
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              From Plan Upload to TCO Projections
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-light">
              Follow these six seamless stages to evaluate the financial health and lifecycle cost of your building assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {workflowSteps.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-850 p-6 rounded-2xl relative shadow-sm group hover:border-indigo-500/50 dark:hover:border-indigo-400/40 transition-all text-left"
                id={`workflow-step-${idx}`}
              >
                <div className="text-3xl font-black text-indigo-500/20 dark:text-indigo-400/10 group-hover:text-indigo-500/40 transition-colors absolute top-4 right-6 font-mono">
                  {item.step}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {item.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* KEY FEATURES */}
      <section className="py-20 border-t border-slate-200/60 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20" id="features-section">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400">
              Core Architecture
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Platform Capabilities
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-light">
              A carefully balanced feature suite tailored strictly to the real-world tracking of building capital and operational outlays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            {keyFeatures.map((feat, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all text-left flex flex-col justify-between"
                id={`feature-card-${idx}`}
              >
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl w-fit border border-slate-100 dark:border-slate-800">
                    {feat.icon}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-900 py-12 bg-white dark:bg-slate-950 transition-colors" id="footer-section">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-900 dark:text-white">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span className="font-black text-xs uppercase tracking-wider">
                BLCTS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-light">
              Enterprise building lifecycle cost management for the construction industry.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              BLCTS Support Team
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              support@blcts.io • © 2026 BLCTS
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
}
