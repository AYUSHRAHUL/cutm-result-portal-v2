"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(data.error || "Invalid credentials, please try again.");
        setLoading(false);
        return;
      }

      setMessage("✅ Login successful! Redirecting...");
      setLoading(false);

      const role = String(data?.user?.role || "user").toLowerCase();
      const target = role === "admin"
        ? "/dashboard/admin"
        : role === "teacher"
          ? "/dashboard/teacher"
          : "/dashboard/user";

      // Immediate hard redirect
      window.location.replace(target);

      // Backup redirect if the first is ignored by the browser
      setTimeout(() => {
        if (window.location.pathname === "/login") {
          window.location.replace(target);
        }
      }, 800);
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.16),transparent_55%),radial-gradient(circle_at_30%_85%,rgba(16,185,129,0.12),transparent_55%),linear-gradient(135deg,#1e3a8a_0%,#312e81_100%)] flex flex-col">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="scale-[0.9] origin-top">
        <div className="w-full max-w-lg rounded-3xl border border-blue-200 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Image src="/spinner.jpg" alt="College logo" width={128} height={128} className="rounded-full shadow-md" priority />
          </div>
          <h1 className="mt-1 text-4xl font-extrabold text-blue-800 drop-shadow-sm">
            Welcome Back
          </h1>
          <p className="mt-2 text-blue-600 text-base font-medium">Sign in to your CUTM Portal account</p>
        </div>

        <div className="p-0 bg-transparent border-0 shadow-none">

        {message && (
          <div
            className={`text-center text-sm mb-6 p-3 rounded-xl ${
              message.includes("✅")
                ? "bg-green-500/20 text-green-200 border border-green-500/30"
                : "bg-red-500/20 text-red-200 border border-red-500/30"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-blue-800 font-semibold mb-2 text-sm">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M1.5 8.67v6.58a2.25 2.25 0 0 0 2.25 2.25h16.5a2.25 2.25 0 0 0 2.25-2.25V8.67l-9.03 4.52a2.25 2.25 0 0 1-2.01 0L1.5 8.67z"/>
                  <path d="M22.5 6.75v-.21A2.25 2.25 0 0 0 20.25 4.5H3.75A2.25 2.25 0 0 0 1.5 6.54v.21l9.72 4.86a.75.75 0 0 0 .66 0L22.5 6.75z"/>
                </svg>
              </div>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
                className="w-full rounded-2xl border border-blue-200 bg-white pl-12 pr-5 py-3 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-800 font-semibold mb-2 text-sm">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12 1.5a4.5 4.5 0 0 0-4.5 4.5v3H6a3 3 0 0 0-3 3v6A3 3 0 0 0 6 21h12a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-1.5v-3A4.5 4.5 0 0 0 12 1.5Zm-3 7.5v-3a3 3 0 1 1 6 0v3H9Z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-blue-200 bg-white pl-12 pr-5 py-3 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <div>
            <a href="/forgot-password" className="text-blue-600 hover:text-blue-800 transition-colors text-sm">
              Forgot your password?
            </a>
          </div>
          <p className="text-blue-600 text-sm">
            Don't have an account?{" "}
            <a href="/register" className="text-blue-700 font-semibold hover:text-blue-900 transition-colors duration-200 underline decoration-2 underline-offset-2">
              Create one here
            </a>
          </p>
        </div>
        </div>
        </div>
        </div>
      </div>

     
    </div>
  );
}
