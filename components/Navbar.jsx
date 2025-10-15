"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = typeof pathname === "string" && pathname.startsWith("/dashboard");

  const roleLower = String(user?.role || "user").toLowerCase();
  const isUserPanel = isDashboard && (roleLower === "user" || roleLower === "student");
  const isActive = (path) => typeof pathname === "string" && pathname.startsWith(path);

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

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) {
    return (
      <nav className="bg-blue-900 text-white flex justify-between items-center px-4 sm:px-6 py-3 min-h-[60px] relative z-50">
        <button 
          className="font-bold text-lg sm:text-xl flex items-center gap-2 sm:gap-3 flex-shrink-0" 
          onClick={() => router.push("/")}
          aria-label="CUTM Portal Home"
        >
          <Image src="/spinner.jpg" alt="CUTM Logo" width={40} height={40} className="rounded-full shadow-sm" priority />
          <span>CUTM Portal</span>
        </button>
        <div />
      </nav>
    );
  }

  return (
    <nav className="bg-blue-900 text-white flex justify-between items-center px-4 sm:px-6 py-3 min-h-[60px] relative z-50">
      <button 
        className="font-bold text-lg sm:text-xl flex items-center gap-2 sm:gap-3 flex-shrink-0" 
        onClick={() => router.push("/")}
        aria-label="CUTM Portal Home"
      >
        <Image src="/spinner.jpg" alt="CUTM Logo" width={40} height={40} className="rounded-full shadow-sm" priority />
        <span>CUTM Portal</span>
      </button>

      {/* User Panel quick links */}
      {isUserPanel && (
        <div className="hidden md:flex items-center gap-1 lg:gap-2 mx-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => router.push("/dashboard/user")}
            className={`px-2.5 py-1.5 rounded text-xs lg:text-sm whitespace-nowrap transition-colors ${
              isActive("/dashboard/user") && !isActive("/dashboard/user/")
                ? "bg-white text-blue-700"
                : "bg-white/10 hover:bg-white/15 text-white"
            }`}
            title="View Results"
          >📊 Results</button>

          <button
            onClick={() => router.push("/dashboard/user/basket-track")}
            className={`px-2.5 py-1.5 rounded text-xs lg:text-sm whitespace-nowrap transition-colors ${
              isActive("/dashboard/user/basket-track") ? "bg-white text-blue-700" : "bg-white/10 hover:bg-white/15 text-white"
            }`}
            title="Basket Track"
          >📋 Basket</button>

          <button
            onClick={() => router.push("/dashboard/user/backlog-track")}
            className={`px-2.5 py-1.5 rounded text-xs lg:text-sm whitespace-nowrap transition-colors ${
              isActive("/dashboard/user/backlog-track") ? "bg-white text-blue-700" : "bg-white/10 hover:bg-white/15 text-white"
            }`}
            title="Backlog Track"
          >⚠️ Backlogs</button>
        </div>
      )}

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
              <div className="absolute right-0 mt-2 w-56 rounded-md bg-white text-gray-900 shadow-lg overflow-hidden z-50 border border-gray-200">
                <div className="px-4 py-3 border-b">
                  <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                  <div className="text-xs text-gray-600 truncate max-w-[12rem]">{user?.email || ''}</div>
                </div>
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
                <div className="border-t" />
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={logout}
                >Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
