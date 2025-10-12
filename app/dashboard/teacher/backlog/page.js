"use client";

import { useEffect, useRef, useState } from "react";

export default function TeacherBacklogPage() {
  const [registration, setRegistration] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  async function search(e) {
    e?.preventDefault();
    setMessage(""); setError(""); setRows([]); setCount(0);
    try {
      setLoading(true);
      const body = registration
        ? { registration }
        : { subject_code: subjectCode, branch, year };
      const res = await fetch("/api/backlogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No backlog found");
      const list = data.backlogs || data.result || [];
      setRows(list);
      setCount(list.length);
      setMessage(data.message || "Results loaded");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    formRef.current?.querySelector('input[name="registration"]').focus();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_25%_25%,rgba(99,102,241,.15),transparent_50%),radial-gradient(circle_at_75%_25%,rgba(168,85,247,.15),transparent_50%)] pb-10">
      <div className="max-w-7xl mx-auto px-6 pt-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow">🕓</span>
            Backlog Management
          </h1>
          <a href="/dashboard/teacher" className="px-3 py-2 rounded-full border border-white/15 text-white/90 hover:bg-white/10">Teacher Panel</a>
        </div>

        {/* Search Forms */}
        <form ref={formRef} onSubmit={search} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-5">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">🔎 Search by Registration</h2>
            <div className="flex gap-3">
              <input name="registration" className="flex-1 rounded-xl border border-white/15 bg-white/90 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900" placeholder="e.g., 220101130056" value={registration} onChange={e => setRegistration(e.target.value.toUpperCase())} />
              <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-4">Search</button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-5">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">🎯 Search by Subject + Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input className="md:col-span-2 rounded-xl border border-white/15 bg-white/90 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900" placeholder="Subject code (e.g., CS101)" value={subjectCode} onChange={e => setSubjectCode(e.target.value.toUpperCase())} />
              <select className="rounded-xl border border-white/15 bg-white/90 px-3 py-2 text-gray-900" value={branch} onChange={e => setBranch(e.target.value)}>
                <option value="">All Branches</option>
                <option value="Civil">Civil</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="Mechanical">Mechanical</option>
              </select>
              <select className="rounded-xl border border-white/15 bg-white/90 px-3 py-2 text-gray-900" value={year} onChange={e => setYear(e.target.value)}>
                <option value="">All Batches</option>
                {["2020","2021","2022","2023","2024","2025"].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="mt-3 text-right">
              <button onClick={search} className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-4">Search with Filters</button>
            </div>
          </div>
        </form>

        {/* Alerts */}
        {message && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 px-4 py-3">✅ {message}</div>}
        {error && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 px-4 py-3">⚠️ {error}</div>}

        {/* Results (no action column) */}
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 text-sm font-bold flex items-center justify-between">
            <span>Backlog Results</span>
            <span>{count} record{count === 1 ? "" : "s"}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  {["Reg","Name","Subject","Code","Sem","Grade"].map(h => <th key={h} className="px-3 py-2 text-left uppercase tracking-wider">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-white/80">No backlog results</td></tr>
                )}
                {rows.map((b, i) => (
                  <tr key={i} className="border-t border-white/10 hover:bg-white/10">
                    <td className="px-3 py-2 text-white/90">{b.Reg_No || b.registration || '-'}</td>
                    <td className="px-3 py-2 text-white/90">{b.Name || '-'}</td>
                    <td className="px-3 py-2 text-white/90">{b.Subject_Name || '-'}</td>
                    <td className="px-3 py-2"><code className="text-indigo-200 bg-indigo-900/30 px-1.5 py-0.5 rounded">{b.Subject_Code || b.subject_code}</code></td>
                    <td className="px-3 py-2"><span className="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-200">{b.Sem || '-'}</span></td>
                    <td className="px-3 py-2"><span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-200">{b.Grade || '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {loading && <div className="mt-4 text-white/80">Loading...</div>}
      </div>
    </div>
  );
}

