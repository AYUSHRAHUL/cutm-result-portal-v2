"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const statsRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [animatedOnce, setAnimatedOnce] = useState(false);
  const [counters, setCounters] = useState({ students: 0, records: 0, backlogs: 0, health: 0 });

  const targetCounts = useMemo(() => ({ students: 2847, records: 156, backlogs: 23, health: 98 }), []);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 120);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!statsRef.current || animatedOnce) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setAnimatedOnce(true);
            animateCounters(targetCounts, 1600);
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [animatedOnce, targetCounts]);

  function animateCounters(target, duration) {
    const start = performance.now();
    const startVals = { ...counters };
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      setCounters({
        students: Math.floor(startVals.students + (target.students - startVals.students) * progress),
        records: Math.floor(startVals.records + (target.records - startVals.records) * progress),
        backlogs: Math.floor(startVals.backlogs + (target.backlogs - startVals.backlogs) * progress),
        health: Math.floor(startVals.health + (target.health - startVals.health) * progress),
      });
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const go = (path) => router.push(path);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.12),transparent_50%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.10),transparent_50%),radial-gradient(circle_at_40%_70%,rgba(245,158,11,0.08),transparent_50%),radial-gradient(circle_at_60%_80%,rgba(139,92,246,0.10),transparent_50%),radial-gradient(circle_at_90%_10%,rgba(236,72,153,0.06),transparent_50%)]">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 z-40" style={{ width: "100%", opacity: 0.08 }} />

      {/* Welcome Header */}
      <section className="pt-16 pb-8 text-center">
        <div className="mx-auto max-w-5xl px-6">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-4xl shadow-[0_0_30px_rgba(59,130,246,0.4)] bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.25),transparent)] animate-[spin_4s_linear_infinite]" />
            <span className="relative">🛡️</span>
        </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-white via-blue-300 to-emerald-300 bg-clip-text text-transparent tracking-tight">
            Admin Dashboard
          </h1>
          <p className="mt-3 text-blue-100/80 max-w-xl mx-auto">Complete management console for the CUTM Result Portal</p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 text-emerald-300/90 text-sm backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Administrator Access Granted
                  </div>
                </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-8 bg-white/5 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon="👥" color="text-blue-400" label="Total Students" value={counters.students} trend="12.5% increase" trendUp />
          <StatCard icon="📄" color="text-emerald-400" label="Active Records" value={counters.records} trend="8.3% increase" trendUp />
          <StatCard icon="⚠️" color="text-amber-400" label="Pending Backlogs" value={counters.backlogs} trend="5.2% decrease" />
          <StatCard icon="📈" color="text-cyan-400" label="System Health" value={counters.health} trend="Excellent" trendUp />
              </div>
      </section>

      {/* Modules */}
      <section className="py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">Administrative Modules</h2>
            <p className="text-blue-100/80 mt-2">Comprehensive tools for managing the system</p>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModuleCard title="Data Upload Center" icon="☁️" gradient="from-blue-500 to-blue-600" onClick={() => go("/dashboard/admin/upload")}>
              Upload and manage student data via CSV/XLSX with validation and batch processing.
            </ModuleCard>
            <ModuleCard title="Data Management" icon="👁️" gradient="from-emerald-500 to-emerald-600" onClick={() => go("/dashboard/admin/records")}>
              View, edit, and manage all student records with filtering and bulk ops.
            </ModuleCard>
            <ModuleCard title="Backlog Management" icon="🕓" gradient="from-amber-500 to-amber-600" onClick={() => go("/dashboard/admin/backlog")}>
              Monitor and manage student backlogs with tracking and reporting.
            </ModuleCard>
            <ModuleCard title="Branch/Batch Portal" icon="🗂️" gradient="from-cyan-500 to-cyan-600" onClick={() => go("/dashboard/admin/batch")}>
              Track and analyze branch and batch datasets with insights.
            </ModuleCard>
            <ModuleCard title="CBCS Management" icon="📚" gradient="from-purple-500 to-purple-600" onClick={() => go("/dashboard/admin/data")}>
              Manage CBCS subjects, baskets and mappings for academic records.
            </ModuleCard>
            <ModuleCard title="Results" icon="📝" gradient="from-rose-500 to-rose-600" onClick={() => go("/dashboard/admin/results")}>
              Search, update and export result entries with auditability.
            </ModuleCard>
              </div>
            </div>
      </section>

      {/* Quick actions */}
      <section className="py-10 bg-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
            <p className="text-blue-100/80">Frequently used administrative tasks</p>
              </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { t: "Add Student", i: "➕" },
              { t: "Search Records", i: "🔎" },
              { t: "Export Data", i: "⬇️" },
              { t: "Notifications", i: "🔔" },
              { t: "Analytics", i: "🥧" },
              { t: "Settings", i: "⚙️" },
            ].map((a, idx) => (
              <div key={idx} className="text-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-md p-4 text-white/90 hover:bg-white/15 transition-transform hover:-translate-y-1 cursor-default">
                <div className="text-2xl mb-2">{a.i}</div>
                <div className="text-sm font-semibold">{a.t}</div>
                <div className="text-xs text-white/70">{idx === 0 ? "Quick registration" : idx === 1 ? "Find data" : idx === 2 ? "Download reports" : idx === 3 ? "System alerts" : idx === 4 ? "Insights" : "Configuration"}</div>
            </div>
            ))}
              </div>
            </div>
      </section>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-transform hover:-translate-y-0.5"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
                  </div>
  );
}

function StatCard({ icon, color, label, value, trend, trendUp }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-5 text-center text-white transition-transform hover:-translate-y-1 hover:shadow-2xl">
      <div className={`text-3xl mb-3 ${color}`}>{icon}</div>
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/70 mt-1">{label}</div>
      <div className={`mt-3 pt-3 border-t border-white/10 text-xs font-semibold ${trendUp ? "text-emerald-400" : "text-rose-400"}`}>
        {trendUp ? "▲" : "▼"} {trend}
        </div>
      <div className="absolute inset-x-0 -top-1 h-1 bg-blue-500/70 scale-x-0 origin-left group-hover:scale-x-100 transition-transform" />
    </div>
  );
}

function ModuleCard({ title, icon, gradient, children, onClick }) {
  return (
    <button onClick={onClick} className="group text-left rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 text-white transition-transform hover:-translate-y-1 hover:shadow-2xl focus:outline-none">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl text-white shadow-lg bg-gradient-to-br ${gradient}`}>{icon}</div>
      <h4 className="text-lg font-bold text-center mb-1">{title}</h4>
      <p className="text-sm text-white/80 text-center mb-3">{children}</p>
      <ul className="text-xs text-white/70 space-y-1 mb-4">
        <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Secure</li>
        <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Fast</li>
        <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Reliable</li>
      </ul>
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-white/20 to-white/10 border border-white/20 text-sm">
          Open <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </button>
  );
}


