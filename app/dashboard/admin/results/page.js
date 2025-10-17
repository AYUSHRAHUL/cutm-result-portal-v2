"use client";

import { useEffect, useRef, useState } from "react";

export default function AdminResultsPage() {
  const [registration, setRegistration] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [sgpa, setSgpa] = useState(null);
  const [cgpa, setCgpa] = useState(null);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  // Helpers: credits parser, grade mapping, SGPA calculator
  function parseCredits(val) {
    if (val === null || val === undefined) return 0;
    const s = String(val).trim();
    if (s === "") return 0;
    if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
    return s
      .split(/[+\s]+/)
      .map(p => parseFloat(p) || 0)
      .reduce((a, b) => a + b, 0);
  }

  function gradeToPoints(grade) {
    const g = String(grade || "").toUpperCase().trim();
    const map = { "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "P": 4, "D": 4, "F": 0, "E": 0, "NA": 0 };
    return map[g] ?? 0;
  }

  function isRedGrade(grade) {
    const g = String(grade || "").toUpperCase().trim();
    return g === "F" || g === "S";
  }

  function computeSgpa(subjectsList) {
    const totals = (subjectsList || []).reduce((acc, s) => {
      const c = parseCredits(s?.Credits);
      const p = gradeToPoints(s?.Grade);
      acc.credits += c;
      acc.points += c * p;
      return acc;
    }, { credits: 0, points: 0 });
    if (totals.credits === 0) return null;
    return Number((totals.points / totals.credits).toFixed(2));
  }

  function displayCredits(val) {
    const n = parseCredits(val);
    return Number.isFinite(n) ? (Number.isInteger(n) ? String(n) : String(n)) : String(val ?? "");
  }

  async function loadSemesters(reg) {
    setError(""); setSemesters([]); setSemester(""); setAllResults([]); setSubjects([]); setSgpa(null); setCgpa(null);
    try {
      const res = await fetch("/api/semesters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration: reg }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No semesters found");
      setSemesters(data.semesters || []);
    } catch (err) { setError(err.message); }
  }

  async function loadResult(e) {
    e.preventDefault();
    setError(""); setSubjects([]); setSgpa(null); setCgpa(null); setAllResults([]);
    if (!registration || !semester) { setError("Enter registration and choose a semester"); return; }
    try {
      setLoading(true);
      if (semester === "ALL") {
        // fetch all, then compute cumulative CGPA strictly up to each semester (weighted by official SGPA and term credits)
        const fetched = [];
        for (const sem of semesters) {
          const r = await fetch("/api/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration, semester: sem }) });
          const d = await r.json();
          if (r.ok && d?.subjects?.length) {
            const termCredits = (d.subjects || []).reduce((acc, s) => acc + parseCredits(s.Credits), 0);
            const termSgpa = d.sgpa ?? computeSgpa(d.subjects);
            fetched.push({ semester: sem, subjects: d.subjects, sgpa: termSgpa, termCredits });
          }
        }
        if (fetched.length === 0) throw new Error("No results found for any semester");
        const semNum = (s) => { const m = String(s).match(/\d+/); return m ? Number(m[0]) : Number(s); };
        fetched.sort((a,b) => (semNum(a.semester)||0) - (semNum(b.semester)||0));
        let cumCredits = 0, cumPoints = 0;
        const results = fetched.map(row => {
          const termCr = Number(row.termCredits || 0);
          const termSg = Number(row.sgpa || 0);
          cumCredits += termCr;
          cumPoints += termCr * termSg;
          const cg = cumCredits > 0 ? Number((cumPoints / cumCredits).toFixed(2)) : termSg;
          return { semester: row.semester, subjects: row.subjects, sgpa: row.sgpa, cgpa: cg };
        });
        setAllResults(results);
      } else {
        const res = await fetch("/api/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration, semester }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No result found");
        const list = data.subjects || [];
        setSubjects(list);
        const currentSgpa = data.sgpa ?? computeSgpa(list);
        setSgpa(currentSgpa);
        // cumulative up to selected semester using only available terms (weighted by each term's SGPA and total credits)
        const target = (()=>{ const m=String(semester).match(/\d+/); return m?Number(m[0]):Number(semester); })();
        let cumCredits = 0, cumPoints = 0;
        for (const sem of semesters) {
          const n = (()=>{ const m=String(sem).match(/\d+/); return m?Number(m[0]):Number(sem); })();
          if (!Number.isFinite(n) || !Number.isFinite(target) || n>target) continue;
          const rr = await fetch("/api/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration, semester: sem }) });
          const dd = await rr.json();
          if (rr.ok && dd?.subjects?.length) {
            const termCr = (dd.subjects || []).reduce((acc, s) => acc + parseCredits(s.Credits), 0);
            const termSg = dd.sgpa ?? computeSgpa(dd.subjects);
            cumCredits += termCr; cumPoints += termCr * termSg;
          }
        }
        const cumulative = cumCredits>0 ? Number((cumPoints/cumCredits).toFixed(2)) : currentSgpa;
        setCgpa(cumulative);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function exportCSV() {
    // Support both single-semester view and ALL view
    let rows = [];
    let header = [];
    if (allResults.length > 0) {
      header = ["Semester","Code","Subject","Credits","Grade"];
      allResults.forEach(r => {
        (r.subjects || []).forEach(s => {
          rows.push([
            escapeCsv(String(r.semester)),
            escapeCsv(s.Subject_Code ?? ""),
            escapeCsv(s.Subject_Name ?? ""),
            escapeCsv(displayCredits(s.Credits)),
            escapeCsv(s.Grade ?? ""),
          ].join(","));
        });
      });
    } else {
      if (subjects.length === 0) return;
      header = ["Code","Subject","Credits","Grade"];
      rows = subjects.map(r => [
        escapeCsv(r.Subject_Code ?? ""),
        escapeCsv(r.Subject_Name ?? ""),
        escapeCsv(displayCredits(r.Credits)),
        escapeCsv(r.Grade ?? ""),
      ].join(","));
    }
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result_${registration}_${semester || 'ALL'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const el = formRef.current?.querySelector('input[name="registration"]');
    el?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_25%_25%,rgba(102,126,234,.15),transparent_50%),radial-gradient(circle_at_75%_75%,rgba(118,75,162,.15),transparent_50%)] pb-10">
      <div className="max-w-6xl mx-auto px-6 pt-16">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Results — Viewer</h1>
          <a href="/dashboard/admin" className="px-3 py-2 rounded-full border border-white/15 text-white/90 hover:bg-white/10">← Admin</a>
        </div>

        <form ref={formRef} onSubmit={loadResult} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-5 mb-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3">
          <input name="registration" className="rounded-xl border border-white/15 bg-white/90 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900" placeholder="Registration (e.g., 2301234567)" value={registration} onChange={e => { const v = e.target.value.toUpperCase(); setRegistration(v); if (v.length >= 6) loadSemesters(v); }} />
          <select className="rounded-xl border border-white/15 bg-white/90 px-3 py-2 text-gray-900" value={semester} onChange={e => setSemester(e.target.value)}>
            <option value="">Select Semester</option>
            <option value="ALL" disabled={semesters.length === 0}>ALL</option>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-5" disabled={loading}>{loading?"Loading...":"View Result"}</button>
          <button type="button" onClick={exportCSV} className="rounded-xl border border-white/20 text-white/90 px-4 hover:bg-white/10" disabled={subjects.length===0 && allResults.length===0}>Export CSV</button>
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
                      <td className="px-3 py-2"><span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white">{displayCredits(r.Credits)}</span></td>
                       <td className="px-3 py-2">
                         <span className={`px-2 py-1 rounded-full text-xs ${isRedGrade(r.Grade) ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/20 text-emerald-200'}`}>{r.Grade}</span>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {allResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
            <aside className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 max-h-[70vh] overflow-auto">
              <h3 className="text-white font-semibold mb-2">Semesters</h3>
              <ul className="space-y-2">
                {allResults.map((r) => (
                  <li key={r.semester} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white/90">
                    <div className="flex items-center justify-between">
                      <span>Semester {r.semester}</span>
                      <span className="text-xs">SGPA: <strong>{r.sgpa ?? '-'}</strong></span>
                    </div>
                    <div className="text-xs text-white/70">Subjects: {r.subjects.length}</div>
                  </li>
                ))}
              </ul>
            </aside>
            <div className="space-y-6">
              {allResults.map((r) => (
                <div key={r.semester} className="rounded-2xl overflow-hidden border border-white/15 bg-white/10 backdrop-blur-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text.white px-5 py-3 text-sm font-bold flex items-center justify-between">
                    <span>Results — {registration} — {r.semester}</span>
                    <div className="flex gap-4 text-white/90">
                      <span>SGPA: <strong>{r.sgpa}</strong></span>
                      <span>CGPA: <strong>{r.cgpa}</strong></span>
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
                        {r.subjects.map((s,i) => (
                          <tr key={i} className="border-t border-white/10 hover:bg-white/10">
                            <td className="px-3 py-2"><code className="text-indigo-200 bg-indigo-900/30 px-1.5 py-0.5 rounded">{s.Subject_Code}</code></td>
                            <td className="px-3 py-2 text-white/90">{s.Subject_Name}</td>
                            <td className="px-3 py-2"><span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white">{displayCredits(s.Credits)}</span></td>
                             <td className="px-3 py-2">
                               <span className={`px-2 py-1 rounded-full text-xs ${isRedGrade(s.Grade) ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/20 text-emerald-200'}`}>{s.Grade}</span>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function escapeCsv(val) {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
  return s;
}


