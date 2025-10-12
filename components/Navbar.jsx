"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = typeof pathname === "string" && pathname.startsWith("/dashboard");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // ignore errors
      }
    };
    fetchUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && !event.target.closest('.relative')) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  };

  return (
    <nav className="bg-blue-600 text-white flex justify-between items-center px-4 sm:px-6 py-3 min-h-[60px] relative z-50">
      <button 
        className="font-bold text-lg sm:text-xl flex-shrink-0" 
        onClick={() => router.push("/")}
      >
        CUTM Portal
      </button>
      
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {user && (
          <div className="relative">
            <button 
              onClick={() => setOpen(v => !v)} 
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 transition-colors"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 text-xs sm:text-sm">👤</span>
              <span className="text-xs sm:text-sm opacity-90 capitalize hidden sm:inline">{String(user.role || "user").toLowerCase()}</span>
              <span className="opacity-80 text-xs sm:text-sm">▾</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white text-gray-900 shadow-lg overflow-hidden z-50 border border-gray-200">
                <button
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    const role = String(user.role || "user").toLowerCase();
                    const base = role === "admin" ? "/dashboard/admin" : role === "teacher" ? "/dashboard/teacher" : "/dashboard/user";
                    router.push(`${base}/profile`);
                  }}
                >View Profile</button>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    const role = String(user.role || "user").toLowerCase();
                    const base = role === "admin" ? "/dashboard/admin" : role === "teacher" ? "/dashboard/teacher" : "/dashboard/user";
                    router.push(`${base}/profile/edit`);
                  }}
                >Edit Profile</button>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    const role = String(user.role || "user").toLowerCase();
                    const target = role === "admin" ? "/dashboard/admin" : role === "teacher" ? "/dashboard/teacher" : "/dashboard/user";
                    router.push(target);
                  }}
                >My Dashboard</button>
              </div>
            )}
          </div>
        )}
        {isDashboard && (
          <button 
            onClick={logout} 
            className="bg-white text-blue-600 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
