"use client";
import { useState } from "react";
import Image from "next/image";

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Basic info, 2: OTP verification
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    employeeId: "",
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [institutionalEmail, setInstitutionalEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (step === 1) {
      // Email domain validation
      const allowedDomains = ['@cutm.ac.in', '@centurionuniv.edu.in'];
      const emailDomain = form.email.substring(form.email.lastIndexOf('@'));
      
      if (!allowedDomains.includes(emailDomain)) {
        setError("❌ Only @cutm.ac.in or @centurionuniv.edu.in email addresses are allowed");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/send-registration-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Failed to send OTP");
          return;
        }

        setInstitutionalEmail(data.institutionalEmail);
        setSuccess(`OTP sent to ${data.emailsSent} email address(es)`);
        setStep(2);
      } catch (err) {
        setError("Something went wrong while sending OTP");
      }
    } else if (step === 2) {
      try {
        const res = await fetch("/api/auth/verify-registration-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, otp, password: form.password }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Registration failed");
          return;
        }

        setSuccess("✅ Registration successful!");
        setStep(3);
      } catch (err) {
        setError("Something went wrong while registering");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-svh relative bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.16),transparent_55%),radial-gradient(circle_at_30%_85%,rgba(16,185,129,0.12),transparent_55%),linear-gradient(135deg,#1e3a8a_0%,#312e81_100%)] flex flex-col">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="scale-[0.75] origin-top">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Image src="/spinner.jpg" alt="College logo" width={128} height={128} className="rounded-full shadow-md" priority />
          </div>
          <h2 className="mt-1 text-4xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent drop-shadow-lg">
            {step === 1 ? "Join CUTM Portal" : step === 2 ? "Verify Your Email" : "Registration Complete!"}
          </h2>
          <p className="mt-2 text-white/90 text-base font-medium">
            {step === 1 ? "Create your account to get started" : step === 2 ? "Enter the OTP sent to your email" : "Your account has been created successfully"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-200 text-sm">
            {success}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-white/95 font-semibold mb-2 text-sm">Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your full name" 
                className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500 transition-all duration-200" 
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                required 
              />
            </div>

            <div>
              <label className="block text-white/95 font-semibold mb-2 text-sm">Email Address</label>
              <input 
                type="email" 
                placeholder="Enter your @cutm.ac.in or @centurionuniv.edu.in email" 
                className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500 transition-all duration-200" 
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                required 
              />
              <p className="text-white/70 text-xs mt-1">Only @cutm.ac.in or @centurionuniv.edu.in emails are allowed</p>
            </div>

            <div>
              <label className="block text-white/95 font-semibold mb-2 text-sm">Password</label>
              <input 
                type="password" 
                placeholder="Create a secure password" 
                className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500 transition-all duration-200" 
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
                required 
              />
            </div>

            <div>
              <label className="block text-white/95 font-semibold mb-2 text-sm">Account Type</label>
              <select 
                className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 transition-all duration-200" 
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user">Student</option>
                <option value="teacher">Teacher</option>
               </select>
            </div>

            {form.role === "teacher" && (
              <div>
                <label className="block text-white/95 font-semibold mb-2 text-sm">Employee ID</label>
                <input 
                  type="text" 
                  placeholder="Enter your employee ID" 
                  className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500 transition-all duration-200" 
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })} 
                  required 
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <p className="text-white/90 text-sm">
                OTP sent to:<br />
                <span className="font-semibold">{form.email}</span><br />
                <span className="font-semibold">{institutionalEmail}</span>
              </p>
            </div>

            <div>
              <label className="block text-white/95 font-semibold mb-2 text-sm">Enter OTP</label>
              <input 
                type="text" 
                placeholder="Enter 6-digit OTP" 
                className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500 transition-all duration-200 text-center text-2xl tracking-widest" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                required 
              />
            </div>

            <button 
              type="submit"
              disabled={loading || !otp || otp.length !== 6}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify & Complete Registration"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="text-6xl">✅</div>
            <h2 className="text-2xl font-bold text-white">Registration Complete!</h2>
            <p className="text-white/80">Your account has been created successfully.</p>
            <a 
              href="/login" 
              className="inline-block w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
            >
              Go to Login
            </a>
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm">
              Already have an account?{" "}
              <a href="/login" className="text-indigo-200 font-semibold hover:text-white transition-colors duration-200 underline decoration-2 underline-offset-2">
                Sign in here
              </a>
            </p>
          </div>
        )}
        </form>
        </div>
      </div>

       
    </div>
  );
}
