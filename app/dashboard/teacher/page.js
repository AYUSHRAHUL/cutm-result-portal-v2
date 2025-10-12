"use client";

import { useRouter } from "next/navigation";

export default function TeacherDashboard() {
  const router = useRouter();

  const go = (path) => router.push(path);

  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.10),transparent_50%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.10),transparent_50%),radial-gradient(circle_at_40%_70%,rgba(16,185,129,0.08),transparent_50%)]">
        {/* Slim top progress accent */}
        <div className="fixed top-0 left-0 right-0 h-1 z-20">
          <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-20" />
        </div>

        {/* Header */}
        <section className="pt-12 pb-4">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-center justify-between">
              <div>
                <nav className="text-sm text-white/70 mb-2">
                  <ol className="flex items-center gap-2">
                    <li><button onClick={() => go('/')} className="hover:text-white">Home</button></li>
                    <li className="opacity-60">/</li>
                    <li className="text-white/90">Teacher</li>
                  </ol>
                </nav>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">Teacher Dashboard</h1>
                <p className="mt-2 text-indigo-100/85">Review results, monitor backlogs, and explore batches with clarity.</p>
              </div>
              <div className="hidden md:block">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 text-sm">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Status: Active
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mini stats */}
        <section className="pb-6">
          <div className="mx-auto max-w-6xl px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="My Classes" value="12" icon="🏫" color="from-indigo-500 to-indigo-600" />
            <StatCard label="Pending Backlogs" value="8" icon="🕓" color="from-amber-500 to-orange-600" />
            <StatCard label="Last Upload" value="2d ago" icon="☁️" color="from-purple-500 to-fuchsia-600" />
            <StatCard label="System Health" value="99%" icon="💠" color="from-emerald-500 to-teal-600" />
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">Modules</h2>
              <p className="text-indigo-100/80 mt-2">Key tools for teachers</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ModuleCard title="Results" icon="📝" gradient="from-indigo-500 to-indigo-600" onClick={() => go("/dashboard/teacher/results")}>View student results by registration and semester, with SGPA/CGPA.</ModuleCard>
              <ModuleCard title="Backlog Review" icon="🕓" gradient="from-amber-500 to-amber-600" onClick={() => go("/dashboard/teacher/backlog")}>Review and update backlog-related entries.</ModuleCard>
              <ModuleCard title="Batch Explorer" icon="🗂️" gradient="from-cyan-500 to-cyan-600" onClick={() => go("/dashboard/teacher/batch")}>Explore branch/batch wise summaries and insights.</ModuleCard>
              <ModuleCard title="CBCS Data" icon="📚" gradient="from-emerald-500 to-emerald-600" onClick={() => go("/dashboard/teacher/data")}>Browse CBCS subjects, baskets and mappings.</ModuleCard>
            </div>
          </div>
        </section>

        <section className="py-8 bg-white/5">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white">Quick Links</h3>
              <p className="text-indigo-100/80">Frequently used teacher actions</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { t: "Find Result", i: "🔎", p: "/dashboard/teacher/results" },
                { t: "Review Backlog", i: "🧾", p: "/dashboard/teacher/backlog" },
                { t: "Batch Summary", i: "📊", p: "/dashboard/teacher/batch" },
                { t: "CBCS Lookup", i: "📘", p: "/dashboard/teacher/data" },
              ].map((a, idx) => (
                <button key={idx} onClick={() => go(a.p)} className="group text-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-md p-4 text-white/90 hover:bg-white/15 transition-transform hover:-translate-y-1">
                  <div className="text-2xl mb-2">{a.i}</div>
                  <div className="text-sm font-semibold">{a.t}</div>
                  <div className="text-xs text-white/70 inline-flex items-center gap-1">Open <span className="transition-transform group-hover:translate-x-0.5">→</span></div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function ModuleCard({ title, icon, gradient, children, onClick }) {
  return (
    <button onClick={onClick} className="group text-left rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 text-white transition-transform hover:-translate-y-1 hover:shadow-2xl focus:outline-none">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl text-white shadow-lg bg-gradient-to-br ${gradient}`}>{icon}</div>
      <h4 className="text-lg font-bold text-center mb-1">{title}</h4>
      <p className="text-sm text-white/80 text-center mb-3">{children}</p>
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-white/20 to-white/10 border border-white/20 text-sm">
          Open <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </button>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-4 text-white">
      <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-20 blur-2xl bg-gradient-to-br ${color}`} />
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/70">{label}</div>
          <div className="text-2xl font-extrabold mt-1">{value}</div>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}

