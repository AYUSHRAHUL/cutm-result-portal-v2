"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function TeacherBasketProgressTracker() {
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [registration, setRegistration] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [semesterValues, setSemesterValues] = useState([]);
  const [basket, setBasket] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Results state (simplified to completed-only view)
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [basketProgress, setBasketProgress] = useState({});

  function clearFilters() {
    setDepartment("");
    setBatch("");
    setRegistration("");
    setSemesterValues([]);
    setBasket("");
    setError("");
    setStudentData(null);
    setBasketProgress({});
    setSearchPerformed(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSearchPerformed(true);
    setLoading(true);
    try {
      // Example: fetch computed progress for a registration
      // You can replace with a real endpoint later
      const res = await fetch("/api/cbcs/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department, batch, registration, semesters: semesterValues, basket })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to load progress");
      setStudentData(data.student || null);
      setBasketProgress(data.basketProgress || {});
    } catch (err) {
      setError(err.message);
      setStudentData(null);
      setBasketProgress({});
    } finally {
      setLoading(false);
    }
  }

  async function loadSemestersForRegistration(value) {
    try {
      const res = await fetch("/api/semesters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration: value }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load semesters");
      setSemesters(data.semesters || []);
    } catch {
      setSemesters([]);
    }
  }

  useEffect(() => {
    if (registration && registration.trim().length >= 6) {
      loadSemestersForRegistration(registration.trim());
    } else {
      setSemesters([]);
    }
  }, [registration]);

  const overallStats = useMemo(() => {
    // Derive simple overall stats from basketProgress (expects API to compute)
    const entries = Object.values(basketProgress || {});
    const totalBaskets = entries.length || 5;
    const basketsCompleted = entries.filter((b) => b && b.is_completed).length;
    const totalEarned = entries.reduce((sum, b) => sum + (Number(b?.earned_credits) || 0), 0);
    const totalRequired = 160;
    const percentage = Math.min(100, Math.round((totalEarned / totalRequired) * 100));
    return { totalBaskets, basketsCompleted, totalEarned, totalRequired, percentage };
  }, [basketProgress]);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] p-5">
      <div className="max-w-[1400px] mx-auto bg-white/95 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] p-6 text-gray-900">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-light text-[#2c3e50] mb-2">🎯 Basket Progress Tracker</h1>
          <p className="text-[#6c757d]">Track your CBCS progress - <strong>Completed Subjects Only</strong></p>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex flex-wrap gap-2">
            <Link href="/dashboard/teacher/data/basket" className="px-4 py-2 rounded-2xl bg-[#6c757d] text-white hover:bg-[#495057] transition">← Back to Baskets</Link>
            <Link href="/dashboard/teacher" className="px-4 py-2 rounded-2xl bg-[#6c757d] text-white hover:bg-[#495057] transition">Main Dashboard</Link>
            <Link href="/dashboard/teacher/data" className="px-4 py-2 rounded-2xl bg-[#6c757d] text-white hover:bg-[#495057] transition">CBCS Management</Link>
          </div>
        </div>

        {/* Simplified Notice */}
        <div className="bg-[#e7f3ff] border-l-4 border-[#2196f3] text-[#1565c0] p-4 rounded mb-6">
          <strong>📢 Simplified View:</strong> This system shows only completed subjects and their earned credits. No grades or pending subjects are displayed.
        </div>

        {/* Filters */}
        <form onSubmit={onSubmit} id="filterForm">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6 bg-[#f8f9fa] p-6 rounded-lg shadow">
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-[#495057]">Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)} className="form-control">
                <option value="">Select Department</option>
                <option value="All">All Departments</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Computer Science Engineering">Computer Science Engineering</option>
                <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-[#495057]">Batch (Year)</label>
              <select value={batch} onChange={e => setBatch(e.target.value)} className="form-control">
                <option value="">Select Batch</option>
                <option value="All">All Batches</option>
                {["20","21","22","23","24","25"].map(y => <option key={y} value={y}>{`20${y} (${y})`}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-[#495057]">Registration No</label>
              <input value={registration} onChange={e => setRegistration(e.target.value)} placeholder="e.g., 21CUTM1234567890" className="form-control" />
            </div>
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-[#495057]">Semester</label>
              <select multiple value={semesterValues} onChange={e => setSemesterValues(Array.from(e.target.selectedOptions).map(o => o.value))} className="form-control min-h-24">
                <option value="">Select Semester</option>
                <option value="All">All Semesters</option>
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-[#495057]">Basket</label>
              <select value={basket} onChange={e => setBasket(e.target.value)} className="form-control">
                <option value="">Select Basket</option>
                <option value="All">All Baskets</option>
                {["Basket I","Basket II","Basket III","Basket IV","Basket V"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className={`btn ${loading ? 'opacity-70 pointer-events-none' : ''}`}>🔍 Track Progress</button>
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>🗑️ Clear</button>
            </div>
          </div>
        </form>

        {error && (
          <div className="alert alert-error mb-6"><strong>❌ Error:</strong> {error}</div>
        )}

        {/* Results */}
        {searchPerformed && studentData && (
          <>
            {/* Student info */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-lg mb-6">
              <h3 className="text-center mb-4">📋 Student Information</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-center">
                <div className="bg-white/10 rounded p-4"><strong className="text-lg">{studentData.name || 'Unknown'}</strong><div>Name</div></div>
                <div className="bg-white/10 rounded p-4"><strong className="text-lg">{studentData.registration || 'Unknown'}</strong><div>Registration No</div></div>
                <div className="bg-white/10 rounded p-4"><strong className="text-lg">{studentData.department || 'Unknown'}</strong><div>Department</div></div>
                <div className="bg-white/10 rounded p-4"><strong className="text-lg">{(studentData.overall_stats?.overall_status) || 'Unknown'}</strong><div>Overall Status</div></div>
              </div>
            </div>

            {/* Overall stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatCard label="Baskets Completed" value={`${overallStats.basketsCompleted}/${overallStats.totalBaskets}`} />
              <StatCard label="Total Earned Credits" value={overallStats.totalEarned} />
              <StatCard label="Total Required Credits" value={overallStats.totalRequired} />
              <StatCard label="Overall Progress" value={`${overallStats.percentage}%`} />
            </div>

            {/* Credit requirements summary */}
            <div className="bg-gradient-to-r from-cyan-600 to-emerald-600 text-white p-6 rounded-lg mb-6 text-center">
              <h3 className="font-semibold">🎓 CBCS Credit Requirements</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                {[
                  ["Basket I",17],["Basket II",12],["Basket III",25],["Basket IV",58],["Basket V",48]
                ].map(([name, cr]) => (
                  <div key={name} className="bg-white/15 rounded p-3">
                    <strong>{name}</strong>
                    <div>{cr} Credits</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-lg font-semibold">Total Required: 160 Credits</div>
            </div>

            {/* Basket cards (completed-only list) */}
            <div className="grid gap-6 md:grid-cols-2">
              {Object.entries(basketProgress || {}).map(([basketName, info]) => {
                const completedSubjects = (info?.subjects || []).filter(s => s.completed);
                const failedSubjects = (info?.subjects || []).filter(s => s.failed);
                const pct = Number(info?.percentage) || 0;
                return (
                  <div key={basketName} className="rounded-lg overflow-hidden shadow bg-white">
                    <div className="border-b border-gray-200 p-5 bg-[#f8f9fa]">
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-semibold text-[#2c3e50]">{basketName || 'Unknown Basket'}</div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${info?.is_completed ? 'bg-green-100 text-green-800' : pct === 0 ? 'bg-gray-200 text-gray-700' : 'bg-rose-100 text-rose-700'}`}>
                          {info?.status || (pct === 0 ? 'Not Started' : 'Pending')}
                        </span>
                      </div>
                      {info?.has_default_subjects && (
                        <div className="mt-3 text-sm bg-yellow-100 text-yellow-800 rounded p-2">
                          ⚠️ <strong>Note:</strong> {info?.default_assigned_count || 0} subject(s) automatically assigned to this basket (not originally categorized)
                        </div>
                      )}
                      <div className="grid grid-cols-5 gap-3 text-center mt-4">
                        <div className="bg-indigo-50 rounded p-2"><span className="font-bold text-[#2c3e50]">{info?.earned_credits || 0}</span><div className="text-xs text-[#6c757d]">Earned</div></div>
                        <div className="bg-rose-50 rounded p-2"><span className="font-bold text-[#2c3e50]">{info?.failed_credits || 0}</span><div className="text-xs text-[#6c757d]">Failed</div></div>
                        <div className="bg-indigo-50 rounded p-2"><span className="font-bold text-[#2c3e50]">{info?.required_credits || 0}</span><div className="text-xs text-[#6c757d]">Required</div></div>
                        <div className="bg-indigo-50 rounded p-2"><span className="font-bold text-[#2c3e50]">{info?.pending_credits || 0}</span><div className="text-xs text-[#6c757d]">Pending</div></div>
                        <div className="bg-indigo-50 rounded p-2"><span className="font-bold text-[#2c3e50]">{pct}%</span><div className="text-xs text-[#6c757d]">Progress</div></div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded mt-4 overflow-hidden">
                        <div className={`h-full ${pct >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="p-5">
                      {completedSubjects.length > 0 ? (
                        <div className="overflow-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-[#f8f9fa]">
                                <th className="text-left p-2">Subject Code</th>
                                <th className="text-left p-2">Subject Name</th>
                                <th className="text-left p-2">Credits</th>
                                <th className="text-left p-2">Status</th>
                                <th className="text-left p-2">Semester</th>
                              </tr>
                            </thead>
                            <tbody>
                              {completedSubjects.map((s, i) => (
                                <tr key={i} className={s.is_default_assigned ? 'bg-yellow-50' : ''}>
                                  <td className="p-2 font-semibold">{s.code || 'Unknown'} {s.is_default_assigned && (<span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-[#212529]">AUTO</span>)}</td>
                                  <td className="p-2">{s.name || 'Unknown Subject'}</td>
                                  <td className="p-2 font-semibold">{s.credits || 0}</td>
                                  <td className="p-2"><span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">✓ Completed</span></td>
                                  <td className="p-2">{s.semester || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="mt-3 p-3 bg-[#f8f9fa] rounded text-sm">
                            <strong>📊 Summary:</strong> {completedSubjects.length} completed subjects contributing {info?.earned_credits || 0} credits to this basket
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-[#6c757d] py-8 italic">
                          <div className="text-3xl mb-3">📚</div>
                          <div><strong>No completed subjects in this basket yet</strong></div>
                          <div className="text-xs">Completed subjects will appear here once records are available</div>
                        </div>
                      )}
                      {failedSubjects.length > 0 && (
                        <div className="mt-5">
                          <h4 className="font-semibold mb-2">Failed/Incomplete Attempts</h4>
                          <div className="overflow-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-[#f8f9fa]">
                                  <th className="text-left p-2">Subject Code</th>
                                  <th className="text-left p-2">Subject Name</th>
                                  <th className="text-left p-2">Credits</th>
                                  <th className="text-left p-2">Status</th>
                                  <th className="text-left p-2">Semester</th>
                                </tr>
                              </thead>
                              <tbody>
                                {failedSubjects.map((s, i) => (
                                  <tr key={i}>
                                    <td className="p-2 font-semibold">{s.code || 'Unknown'}</td>
                                    <td className="p-2">{s.name || 'Unknown Subject'}</td>
                                    <td className="p-2 font-semibold">{s.credits || 0}</td>
                                    <td className="p-2"><span className="inline-block px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-800">✗ Not Completed</span></td>
                                    <td className="p-2">{s.semester || '-'}</td>
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
              })}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-800 rounded p-4 text-sm">
              <strong>🔍 Simplified Tracking System:</strong>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li><strong>Display:</strong> Only completed subjects are shown</li>
                <li><strong>No Grades:</strong> Grade information is not displayed</li>
                <li><strong>No Pending:</strong> Incomplete/pending subjects are hidden</li>
                <li><strong>Clean View:</strong> Focus on achievements and progress only</li>
              </ul>
            </div>
          </>
        )}

        {searchPerformed && !studentData && (
          <div className="alert alert-info">🔍 No Completed Subjects Found. Please verify the registration and try again.</div>
        )}

        {!searchPerformed && (
          <div className="alert alert-info">
            <strong>🎯 Welcome to Simplified Basket Progress Tracker!</strong><br />
            This system shows only completed subjects without grades or pending items.
          </div>
        )}
      </div>

      <style jsx>{`
        .form-control { padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; }
        .form-control:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
        .btn { padding: 12px 20px; background: linear-gradient(45deg, #667eea, #764ba2); color: #fff; border-radius: 8px; font-weight: 500; transition: all .2s; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102,126,234,.4); }
        .btn-secondary { background: #6c757d; }
        .alert { padding: 12px 16px; border-radius: 8px; }
        .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .alert-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
      `}</style>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-indigo-500">
      <span className="block text-2xl font-bold text-[#2c3e50]">{value}</span>
      <div className="text-[#6c757d] font-medium mt-1">{label}</div>
    </div>
  );
}