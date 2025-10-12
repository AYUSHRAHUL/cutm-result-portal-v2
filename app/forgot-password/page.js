"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: New password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [institutionalEmail, setInstitutionalEmail] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess("Password updated successfully!");
      setStep(3);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.16),transparent_55%),radial-gradient(circle_at_30%_85%,rgba(16,185,129,0.12),transparent_55%),linear-gradient(135deg,#1e3a8a_0%,#312e81_100%)] flex flex-col">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🔐 Reset Password</h1>
            <p className="text-white/80">Enter your email to receive OTP</p>
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
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-white/95 font-semibold mb-2 text-sm">Email Address</label>
                <input 
                  type="email" 
                  placeholder="Enter your @cutm.ac.in or @centurionuniv.edu.in email" 
                  className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500 transition-all duration-200" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
                <p className="text-white/70 text-xs mt-1">Only @cutm.ac.in or @centurionuniv.edu.in emails are allowed</p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-white/90 text-sm">
                  OTP sent to:<br />
                  <span className="font-semibold">{email}</span><br />
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

              <div>
                <label className="block text-white/95 font-semibold mb-2 text-sm">New Password</label>
                <input 
                  type="password" 
                  placeholder="Enter new password" 
                  className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500 transition-all duration-200" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label className="block text-white/95 font-semibold mb-2 text-sm">Confirm Password</label>
                <input 
                  type="password" 
                  placeholder="Confirm new password" 
                  className="w-full rounded-2xl border border-white/20 bg-white/95 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500 transition-all duration-200" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-300 text-sm">Passwords do not match</p>
              )}

              <button 
                type="submit" 
                disabled={loading || newPassword !== confirmPassword || !otp || !newPassword}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="text-6xl">✅</div>
              <h2 className="text-2xl font-bold text-white">Password Updated!</h2>
              <p className="text-white/80">Your password has been successfully updated.</p>
              <Link 
                href="/login" 
                className="inline-block w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Go to Login
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-white/70 hover:text-white transition-colors text-sm">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-2">CUTM Result Portal</h3>
            <p className="text-white/80 text-sm mb-4">
              Empowering students with transparent, secure, and instant access to their academic achievements through innovative technology.
            </p>
            <div className="flex justify-center space-x-6 text-white/60 text-sm">
              <span>© 2025 CUTM Result Portal. All rights reserved.</span>
              <span>|</span>
              <span>Crafted with excellence for academic success.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
