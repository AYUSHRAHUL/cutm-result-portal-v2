"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResultPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  const registration = params.get("reg");
  const semesterParam = params.get("sem");

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [multi, setMulti] = useState([]); // [{ semester, data }]

  const parseCredits = (value) => {
    if (value == null) return 0;
    const str = String(value).trim();
    if (!str) return 0;
    const parts = str.split(/[+\-]/).map((p) => Number(p.trim()) || 0);
    const ops = str.match(/[+\-]/g) || [];
    if (ops.length === 0) return parts[0] || 0;
    let total = parts[0] || 0;
    for (let i = 0; i < ops.length; i++) {
      total = ops[i] === '-' ? total - (parts[i + 1] || 0) : total + (parts[i + 1] || 0);
    }
    return total;
  };

  // Map grades to points for SGPA/CGPA calculations
  const gradeToPoints = (g) => {
    const grade = String(g || '').toUpperCase();
    const map = { O: 10, E: 9, A: 8, B: 7, C: 6, D: 5 };
    return map[grade] ?? 0; // F/S/M/I/R => 0
  };

  const computeSgpa = (subjects = []) => {
    if (!Array.isArray(subjects) || subjects.length === 0) return 0;
    let totalCredits = 0;
    let totalPoints = 0;
    for (const s of subjects) {
      const cr = parseCredits(s?.Credits);
      totalCredits += cr;
      totalPoints += cr * gradeToPoints(s?.Grade);
    }
    if (totalCredits === 0) return 0;
    return Number((totalPoints / totalCredits).toFixed(2));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        if (!registration || !semesterParam) {
          throw new Error("Missing parameters");
        }

        // Build list of semesters to fetch
        let semestersToFetch = [];
        if (semesterParam.toUpperCase() === "ALL") {
          const r = await fetch("/api/semesters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registration })
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || "Unable to load semesters");
          semestersToFetch = (d.semesters || []).slice();
        } else {
          semestersToFetch = semesterParam.split(",").map(s => s.trim()).filter(Boolean);
        }

        if (semestersToFetch.length === 0) {
          throw new Error("No semesters selected");
        }

        // If single semester, keep previous simple view
        if (semestersToFetch.length === 1) {
          const semester = semestersToFetch[0];
          const res = await fetch("/api/result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registration, semester })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Result not found");
          setResult(data);
          setMulti([]);
          return;
        }

        // Multi-semester: fetch all and store
        const fetched = [];
        for (const sem of semestersToFetch) {
          const r = await fetch("/api/result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registration, semester: sem })
          });
          const d = await r.json();
          if (r.ok && d?.subjects?.length) {
            // Compute term credits and sgpa if needed
            const termCredits = (d.subjects || []).reduce((acc,s)=> acc + parseCredits(s.Credits), 0);
            const termSgpa = d.sgpa ?? computeSgpa(d.subjects);
            fetched.push({ semester: sem, data: { ...d, termCredits, termSgpa } });
          }
        }
        if (fetched.length === 0) throw new Error("No results found for selected semesters");
        // Sort semesters naturally if they are like 'Semester 1', 'Semester 2'
        fetched.sort((a,b)=> (a.semester > b.semester ? 1 : -1));
        // Build cumulative CGPA per term (admin logic)
        let cumCredits = 0, cumPoints = 0;
        const processed = fetched.map((row) => {
          const termCr = Number(row.data.termCredits || 0);
          const termSg = Number(row.data.termSgpa || row.data.sgpa || 0);
          cumCredits += termCr;
          cumPoints += termCr * termSg;
          const cg = cumCredits > 0 ? Number((cumPoints / cumCredits).toFixed(2)) : termSg;
          return { ...row, data: { ...row.data, termCgpa: cg } };
        });
        setMulti(processed);
        setResult(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [registration, semesterParam]);

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-sky-500 text-white">
        <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-semibold">Loading Result...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-red-500 bg-white">
        <h1 className="text-2xl font-bold mb-4">⚠️ {error}</h1>
        <button
          onClick={() => router.push("/dashboard/user")}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );

  // Single semester view (legacy)
  if (!loading && !error && result && multi.length === 0) {
    const semester = semesterParam;
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-gray-900 flex flex-col items-center py-10 px-4">
        <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl">
          <div className="text-center mb-8">
            <img
              src="https://tse1.mm.bing.net/th/id/OIP.yR5DUnUlOBL5eCaPQ9HFgwHaHZ?rs=1&pid=ImgDetMain"
              alt="CUTM Logo"
              className="mx-auto w-24 h-24 rounded-full border-4 border-[#0a2a6c]"
            />
            <h1 className="text-2xl font-bold text-[#0a2a6c] mt-3">
              Centurion University of Technology and Management
            </h1>
            <h2 className="text-lg text-[#1d3a94] font-semibold">
              School Of Engineering & Technology, Paralakhemundi
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm mb-6">
            <p>
              <b className="text-[#0a2a6c]">Registration No:</b> {registration}
            </p>
            <p>
              <b className="text-[#0a2a6c]">Semester:</b> {semester}
            </p>
            <p>
              <b className="text-[#0a2a6c]">SGPA:</b> {result.sgpa}
            </p>
            <p>
              <b className="text-[#0a2a6c]">CGPA:</b> {result.cgpa}
            </p>
          </div>

          <div className="overflow-x-auto border rounded-lg shadow-sm mb-6">
            <table className="min-w-full border-collapse bg-white text-sm">
              <thead className="bg-[#0a2a6c] text-white">
                <tr>
                  <th className="border p-2">Subject Code</th>
                  <th className="border p-2 text-left">Subject Name</th>
                  <th className="border p-2">Credits</th>
                  <th className="border p-2">Grade</th>
                </tr>
              </thead>
              <tbody>
                {result.subjects.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="border p-2 text-center">{s.Subject_Code}</td>
                    <td className="border p-2">{s.Subject_Name}</td>
                    <td className="border p-2 text-center">{parseCredits(s.Credits)}</td>
                    <td
                      className={`border p-2 text-center font-bold ${
                        ["O", "E", "A"].includes(s.Grade)
                          ? "text-green-600"
                          : ["B", "C"].includes(s.Grade)
                          ? "text-blue-600"
                          : "text-red-600"
                      }`}
                    >
                      {s.Grade}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="border p-2 text-right" colSpan={2}>Total</td>
                  <td className="border p-2 text-center">
                    {Array.isArray(result?.subjects)
                      ? result.subjects.reduce((sum, s) => sum + parseCredits(s?.Credits), 0)
                      : 0}
                  </td>
                  <td className="border p-2 text-center">—</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => router.push("/dashboard/user")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg"
            >
              ← Back
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gradient-to-r from-[#0a2a6c] to-[#1d3a94] text-white font-semibold px-5 py-2 rounded-lg hover:scale-105 transition"
            >
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Multi-semester view
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 py-10 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-4 md:p-6 w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <img
            src="https://tse1.mm.bing.net/th/id/OIP.yR5DUnUlOBL5eCaPQ9HFgwHaHZ?rs=1&pid=ImgDetMain"
            alt="CUTM Logo"
            className="mx-auto w-24 h-24 rounded-full border-4 border-[#0a2a6c]"
          />
          <h1 className="text-2xl font-bold text-[#0a2a6c] mt-3">
            Centurion University of Technology and Management
          </h1>
          <h2 className="text-lg text-[#1d3a94] font-semibold">
            School Of Engineering & Technology, Paralakhemundi
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar with semesters */}
          <aside className="md:col-span-3">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-[#0a2a6c] text-white px-4 py-2 text-sm font-semibold">Selected Semesters</div>
              <ul className="divide-y">
                {multi.map((m, idx) => (
                  <li key={m.semester} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <a href={`#sem-${idx}`} className="text-[#0a2a6c] font-medium">{m.semester}</a>
                    <span className="text-xs text-gray-600">SGPA: {m.data.sgpa ?? '-'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Results content */}
          <main className="md:col-span-9 space-y-8 max-h-[70vh] overflow-y-auto pr-1">
            {multi.map((m, idx) => (
              <section key={m.semester} id={`sem-${idx}`} className="border rounded-2xl shadow-sm">
                <div className="px-5 py-4 bg-gray-50 flex items-center justify-between">
                  <div className="font-semibold text-[#0a2a6c]">{m.semester}</div>
                  <div className="text-sm text-gray-700">SGPA: <b>{m.data.termSgpa ?? m.data.sgpa ?? '-'}</b> | CGPA: <b>{m.data.termCgpa ?? '-'}</b></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse bg-white text-sm">
                    <thead className="bg-[#0a2a6c] text-white">
                      <tr>
                        <th className="border p-2">Subject Code</th>
                        <th className="border p-2 text-left">Subject Name</th>
                        <th className="border p-2">Credits</th>
                        <th className="border p-2">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.data.subjects.map((s, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          <td className="border p-2 text-center">{s.Subject_Code}</td>
                          <td className="border p-2">{s.Subject_Name}</td>
                          <td className="border p-2 text-center">{parseCredits(s.Credits)}</td>
                          <td className={`border p-2 text-center font-bold ${
                            ["O","E","A"].includes(s.Grade) ? "text-green-600" : ["B","C"].includes(s.Grade) ? "text-blue-600" : "text-red-600"}`}>{s.Grade}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td className="border p-2 text-right" colSpan={2}>Total</td>
                        <td className="border p-2 text-center">{m.data.subjects.reduce((sum, s)=> sum + parseCredits(s.Credits), 0)}</td>
                        <td className="border p-2 text-center">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            ))}
          </main>
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={() => router.push("/dashboard/user")} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg">← Back</button>
          <button onClick={() => window.print()} className="bg-gradient-to-r from-[#0a2a6c] to-[#1d3a94] text-white font-semibold px-5 py-2 rounded-lg hover:scale-105 transition">🖨️ Print / Save as PDF</button>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-sky-500 text-white">
        <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-semibold">Loading Result...</p>
      </div>
    }>
      <ResultPageContent />
    </Suspense>
  );
}
