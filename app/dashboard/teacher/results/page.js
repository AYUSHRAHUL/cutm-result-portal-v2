"use client";

import { useEffect, useRef, useState } from "react";

export default function TeacherResultsPage() {
  const [registration, setRegistration] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [sgpa, setSgpa] = useState(null);
  const [cgpa, setCgpa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  async function loadSemesters(reg) {
    setError(""); setSemesters([]); setSemester("");
    try {
      const res = await fetch("/api/semesters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration: reg }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No semesters found");
      setSemesters(data.semesters || []);
    } catch (err) { setError(err.message); }
  }

  async function loadResult(e) {
    e.preventDefault();
    setError(""); setSubjects([]); setSgpa(null); setCgpa(null);
    if (!registration || !semester) { setError("Enter registration and choose a semester"); return; }
    try {
      setLoading(true);
      const res = await fetch("/api/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration, semester }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No result found");
      setSubjects(data.subjects || []);
      setSgpa(data.sgpa); setCgpa(data.cgpa);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const el = formRef.current?.querySelector('input[name="registration"]');
    el?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_25%_25%,rgba(102,126,234,.15),transparent_50%),radial-gradient(circle_at_75%_75%,rgba(118,75,162,.15),transparent_50%)] pb-10">
      <div className="max-w-5xl mx-auto px-6 pt-16">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">Student Result Viewer</h1>

        <form ref={formRef} onSubmit={loadResult} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-5 mb-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <input name="registration" className="rounded-xl border border-white/15 bg-white/90 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900" placeholder="Registration (e.g., 2301234567)" value={registration} onChange={e => { const v = e.target.value.toUpperCase(); setRegistration(v); if (v.length >= 6) loadSemesters(v); }} />
          <select className="rounded-xl border border-white/15 bg-white/90 px-3 py-2 text-gray-900" value={semester} onChange={e => setSemester(e.target.value)}>
            <option value="">Select Semester</option>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-5" disabled={loading}>{loading?"Loading...":"View Result"}</button>
        </form>

        {error && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 px-4 py-3">{error}</div>}

        {subjects.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-white/15 bg-white/10 backdrop-blur-xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 text-sm font-bold flex items-center justify-between">
              <span>Results — {registration} — {semester}</span>
              <div className="flex gap-4 text-white/90">
                <span>SGPA: <strong>{sgpa}</strong></span>
                <span>CGPA: <strong>{cgpa}</strong></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    {['Code','Subject','Credits','Grade'].map(h => <th key={h} className="px-3 py-2 text-left uppercase tracking-wider">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((r,i) => (
                    <tr key={i} className="border-t border-white/10 hover:bg-white/10">
                      <td className="px-3 py-2"><code className="text-indigo-200 bg-indigo-900/30 px-1.5 py-0.5 rounded">{r.Subject_Code}</code></td>
                      <td className="px-3 py-2 text-white/90">{r.Subject_Name}</td>
                      <td className="px-3 py-2"><span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white">{r.Credits}</span></td>
                      <td className="px-3 py-2"><span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-200">{r.Grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


