"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-white/20 to-white/10 border border-white/20 text-white text-3xl shadow-2xl backdrop-blur-sm">
            🔐
          </div>
          <h1 className="mt-4 text-4xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent drop-shadow-lg">
            Welcome Back
          </h1>
          <p className="mt-2 text-white/90 text-base font-medium">Sign in to your CUTM Portal account</p>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">

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
            <label className="block text-white/95 font-semibold mb-2 text-sm">Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Enter your email address"
              className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-white/95 font-semibold mb-2 text-sm">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500 transition-all duration-200"
            />
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
            <a href="/forgot-password" className="text-white/70 hover:text-white transition-colors text-sm">
              Forgot your password?
            </a>
          </div>
          <p className="text-white/80 text-sm">
            Don't have an account?{" "}
            <a href="/register" className="text-indigo-200 font-semibold hover:text-white transition-colors duration-200 underline decoration-2 underline-offset-2">
              Create one here
            </a>
          </p>
        </div>
        </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 relative z-10">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-white mb-2">CUTM Result Portal</h3>
            <p className="text-white/80 text-sm max-w-2xl mx-auto">
              Empowering students with transparent, secure, and instant access to their academic achievements through innovative technology.
            </p>
          </div>
          <div className="text-white/70 text-xs">
            © {new Date().getFullYear()} CUTM Result Portal. All rights reserved. | Crafted with excellence for academic success.
          </div>
        </div>
      </footer>
    </div>
  );
}
