"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function AdminRecordsPage() {
  const [registration, setRegistration] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const totalCredits = rows.reduce((acc, r) => acc + sumCredits(r.Credits), 0);
  const formRef = useRef(null);

  async function search(e) {
    e?.preventDefault();
    setMessage(""); setError(""); setRows([]);
    const reg = registration.trim().toUpperCase();
    if (!reg) { 
      setError("Please enter a registration number."); 
      return; 
    }
    
    // Accept either CUTM-style (e.g., 21CUTM1234567890) or plain registration numbers
    const isCUTM = /^[0-9]{2}CUTM[0-9]{10}$/.test(reg);
    const isPlain = /^[A-Z0-9\-]{6,20}$/.test(reg); // lenient plain format (alnum/hyphen)
    if (!isCUTM && !isPlain) {
      setError("Invalid registration. Enter CUTM format (21CUTMXXXXXXXXXX) or plain Reg No.");
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration: reg })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No records found");
      setRows(data.records || []);
      if (data.records && data.records.length > 0) {
        setMessage(`Found ${data.records.length} academic records for ${reg}`);
      }
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function updateGrade(row, newGrade) {
    const grade = String(newGrade || "").trim().toUpperCase();
    if (!grade) return;
    
    // Validate grade
    const validGrades = ["O","E","A","B","C","D","F","S","M","I","R"];
    if (!validGrades.includes(grade)) {
      setError("Invalid grade. Please select a valid grade.");
      return;
    }
    
    if (!confirm(`Update grade for ${row.Subject_Name} (${row.Subject_Code}) to ${grade}?`)) return;
    try {
      setLoading(true); setError(""); setMessage("");
      const payload = { ...row, Grade: grade };
      const res = await fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMessage(`Grade updated successfully for ${row.Subject_Name} (${row.Subject_Code}) to ${grade}`);
      await search();
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    // autofocus
    const el = formRef.current?.querySelector('input[name="registration"]');
    if (el) el.focus();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        search();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [registration]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_25%_25%,rgba(102,126,234,.15),transparent_50%),radial-gradient(circle_at_75%_75%,rgba(118,75,162,.15),transparent_50%)] pb-10">
      <div className="max-w-7xl mx-auto px-6 pt-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow">📚</span>
            Student Records Management
          </h1>
          <Link href="/dashboard/admin" className="px-3 py-2 rounded-full border border-white/15 text-white/90 hover:bg-white/10">← Back to Admin</Link>
        </div>

        {/* Search */}
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">🔎 Search Student Records</h2>
          <form ref={formRef} onSubmit={search} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <input
              name="registration"
              className="rounded-xl border border-white/15 bg-white/90 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900"
              placeholder="Enter registration number (CUTM or plain)"
              value={registration}
              onChange={e => setRegistration(e.target.value.toUpperCase())}
              // allow longer IDs; server handles exact matching
            />
            <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-5 py-2 disabled:opacity-50" disabled={loading}>
              {loading ? "Searching..." : "Search Records"}
            </button>
          </form>
        </div>

        {/* Alerts */}
        {message && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 px-4 py-3">✅ {message}</div>}
        {error && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 px-4 py-3">⚠️ {error}</div>}
        
        {/* Help Text */}
        {!rows.length && !error && (
          <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-200 px-4 py-3">
            💡 <strong>Tip:</strong> You can enter either CUTM Reg (e.g., 21CUTM1234567890) or a plain registration number.
            <br />
            <small className="text-blue-300">💻 Press Ctrl+Enter to search quickly</small>
          </div>
        )}

        {/* Table */}
        {rows.length > 0 ? (
          <div className="rounded-2xl overflow-hidden border border-white/15 bg-white/10 backdrop-blur-xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 text-sm font-bold">Academic Records — {registration}</div>
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    {['Reg No','Name','Sem','Code','Subject','Credits','Grade','Update'].map(h => (
                      <th key={h} className="px-3 py-2 text-left uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-white/10 hover:bg-white/10">
                      <td className="px-3 py-2 font-semibold text-white/90">{r.Reg_No}</td>
                      <td className="px-3 py-2 text-white/90">{r.Name}</td>
                      <td className="px-3 py-2"><span className="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-200">{r.Sem}</span></td>
                      <td className="px-3 py-2"><code className="text-indigo-200 bg-indigo-900/30 px-1.5 py-0.5 rounded">{r.Subject_Code}</code></td>
                      <td className="px-3 py-2 text-white/90">{r.Subject_Name}</td>
                      <td className="px-3 py-2"><span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white">{r.Credits}</span></td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${badgeClass(r.Grade)}`}>{r.Grade}</span>
                      </td>
                      <td className="px-3 py-2">
                        <select defaultValue="" className="rounded border border-white/20 bg-white/10 text-white/90 text-xs px-2 py-1"
                          onChange={e => { const v = e.target.value; e.target.value = ""; updateGrade(r, v); }}>
                          <option value="">Select</option>
                          {["O","E","A","B","C","D","F","S","M","I","R"].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">
                    <td className="px-3 py-2 text-right" colSpan={5}>TOTAL CREDITS:</td>
                    <td className="px-3 py-2"><span className="px-2 py-1 rounded bg-white text-gray-900">{totalCredits.toFixed(1)}</span></td>
                    <td className="px-3 py-2" colSpan={2}><span className="text-sm opacity-90">Cumulative credits earned</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-white/10 bg-white/5 text-white/90 text-sm grid grid-cols-4 gap-3 text-center">
              <FooterStat label="Total Subjects" value={rows.length} color="text-white" />
              <FooterStat label="Total Credits" value={totalCredits.toFixed(1)} color="text-emerald-300" />
              <FooterStat label="Passed" value={rows.filter(r => !["F","M","S"].includes(r.Grade)).length} color="text-emerald-300" />
              <FooterStat label="Failed" value={rows.filter(r => ["F","M","S"].includes(r.Grade)).length} color="text-rose-300" />
            </div>
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-10 text-center text-white/90">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <h3 className="text-lg font-semibold mb-1">Searching Records...</h3>
            <p className="text-white/70">Please wait while we fetch the academic records.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-10 text-center text-white/90">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">🔎</div>
            <h3 className="text-lg font-semibold mb-1">Search Student Academic Records</h3>
            <p className="text-white/70">Enter a registration number above to view and manage grades.</p>
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-5 text-center text-white/90">
          <h4 className="font-semibold mb-3">⚙️ Quick Actions</h4>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/dashboard/admin/upload" className="px-4 py-2 rounded-full border border-white/15 hover:bg-white/10">Upload Data</Link>
            <Link href="/dashboard/admin/backlog" className="px-4 py-2 rounded-full border border-white/15 hover:bg-white/10">View Backlogs</Link>
            <Link href="/dashboard/admin" className="px-4 py-2 rounded-full border border-white/15 hover:bg-white/10">Admin Panel</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function sumCredits(creditStr) {
  if (!creditStr) return 0;
  const str = String(creditStr).replace(/--/g, "+");
  return str.split("+").filter(Boolean).map(Number).filter(n => !Number.isNaN(n)).reduce((a,b)=>a+b,0);
}

function badgeClass(grade) {
  if (["O","E","A"].includes(grade)) return "bg-emerald-500/20 text-emerald-200";
  if (["B","C","D"].includes(grade)) return "bg-amber-500/20 text-amber-200";
  if (["F","M","S"].includes(grade)) return "bg-rose-500/20 text-rose-200";
  return "bg-white/20 text-white";
}

function FooterStat({ label, value, color }) {
  return (
    <div>
      <small className="block text-white/70">{label}</small>
      <strong className={`text-base ${color}`}>{value}</strong>
    </div>
  );
}


