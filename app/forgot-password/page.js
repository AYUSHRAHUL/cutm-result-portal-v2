"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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

  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const clamp = Math.min(score, 4);
    const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];
    const rings = ["ring-red-400/50", "ring-orange-400/50", "ring-yellow-400/50", "ring-green-400/50", "ring-emerald-400/50"];

    return { score: clamp, label: labels[clamp], color: colors[clamp], ring: rings[clamp] };
  };

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.16),transparent_55%),radial-gradient(circle_at_30%_85%,rgba(16,185,129,0.12),transparent_55%),linear-gradient(135deg,#1e3a8a_0%,#312e81_100%)] flex flex-col relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md rounded-3xl border border-blue-200 bg-white p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <Image
                src="/spinner.jpg"
                alt="College logo"
                width={128}
                height={128}
                className="rounded-full shadow-md"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-blue-800 mb-2">🔐 {step === 1 ? 'Reset Password' : step === 2 ? 'Verify OTP & Set Password' : 'All Set'}</h1>
            <p className="text-blue-600">{step === 1 ? 'Enter your email to receive an OTP' : step === 2 ? 'Enter the OTP and your new password' : 'Your password has been updated'}</p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1,2,3].map((s) => (
                <div key={s} className="flex-1 flex items-center">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold shadow-inner transition-colors duration-200 ${step >= s ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>{s}</div>
                  {s !== 3 && (
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-colors duration-200 ${step > s ? 'bg-blue-300' : 'bg-blue-100'}`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-blue-600">
              <span>Enter Email</span>
              <span>Verify & Set</span>
              <span>Done</span>
            </div>
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
                <label className="block text-blue-800 font-semibold mb-2 text-sm">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    {/* Mail icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M1.5 8.67v6.58a2.25 2.25 0 0 0 2.25 2.25h16.5a2.25 2.25 0 0 0 2.25-2.25V8.67l-9.03 4.52a2.25 2.25 0 0 1-2.01 0L1.5 8.67z"/>
                      <path d="M22.5 6.75v-.21A2.25 2.25 0 0 0 20.25 4.5H3.75A2.25 2.25 0 0 0 1.5 6.54v.21l9.72 4.86a.75.75 0 0 0 .66 0L22.5 6.75z"/>
                    </svg>
                  </div>
                  <input 
                    type="email" 
                    placeholder="Enter your @cutm.ac.in or @centurionuniv.edu.in email" 
                    className="w-full rounded-2xl border border-blue-200 bg-white pl-12 pr-5 py-3 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <p className="text-blue-600 text-xs mt-1">Only @cutm.ac.in or @centurionuniv.edu.in emails are allowed</p>
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
                <p className="text-blue-700 text-sm">
                  OTP sent to:<br />
                  <span className="font-semibold">{email}</span><br />
                  {institutionalEmail && (
                    <span className="font-semibold">{institutionalEmail}</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-blue-800 font-semibold mb-2 text-sm">Enter OTP</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    {/* Key icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 1 0 3.66 12.45l2.22 2.22a.75.75 0 0 0 .53.22h1.34a.75.75 0 0 0 .75-.75V14.1a.75.75 0 0 0-.22-.53l-2.22-2.22A6.75 6.75 0 0 0 15.75 1.5Zm-3 6.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    className="w-full rounded-2xl border border-blue-200 bg-white pl-12 pr-5 py-3 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200 tracking-widest" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    inputMode="numeric"
                    pattern="\\d{6}"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-blue-800 font-semibold mb-2 text-sm">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    {/* Lock icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M12 1.5a4.5 4.5 0 0 0-4.5 4.5v3H6a3 3 0 0 0-3 3v6A3 3 0 0 0 6 21h12a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-1.5v-3A4.5 4.5 0 0 0 12 1.5Zm-3 7.5v-3a3 3 0 1 1 6 0v3H9Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Enter new password" 
                    className="w-full rounded-2xl border border-blue-200 bg-white pl-12 pr-5 py-3 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>
                {newPassword && (
                  <div className="mt-3">
                    {(() => {
                      const s = getPasswordStrength(newPassword);
                      return (
                        <div className={`rounded-xl bg-blue-50 p-3 border border-blue-100 ${s.ring}`}>
                          <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
                            <div className={`h-2 rounded-full transition-all duration-300 ${s.color}`} style={{ width: `${(s.score + 1) * 20}%` }}></div>
                          </div>
                          <div className="mt-2 text-xs text-blue-700">
                            Strength: <span className="font-semibold">{s.label}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-blue-800 font-semibold mb-2 text-sm">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    {/* Check icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Zm13.1-2.58a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 1.06-1.06l1.47 1.47 4.47-4.47Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Confirm new password" 
                    className="w-full rounded-2xl border border-blue-200 bg-white pl-12 pr-5 py-3 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-all duration-200" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
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
              <h2 className="text-2xl font-bold text-blue-800">Password Updated!</h2>
              <p className="text-blue-600">Your password has been successfully updated.</p>
              <Link 
                href="/login" 
                className="inline-block w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Go to Login
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-blue-600 hover:text-blue-800 transition-colors text-sm">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>

     
    </div>
  );
}
