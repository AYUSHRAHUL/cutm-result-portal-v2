"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResultPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  const registration = params.get("reg");
  const semester = params.get("sem");

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch("/api/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registration, semester }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Result not found");
        setResult(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (registration && semester) fetchResult();
  }, [registration, semester]);

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
                  <td className="border p-2 text-center">{s.Credits}</td>
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
