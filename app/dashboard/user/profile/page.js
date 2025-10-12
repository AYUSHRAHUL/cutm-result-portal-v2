"use client";
import { useEffect, useState } from "react";

export default function UserProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load profile");
        setUser(data.user);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">My Profile</h1>
      <div className="bg-white rounded border p-4">
        <div className="mb-2"><span className="font-medium">Name:</span> {user?.name}</div>
        <div className="mb-2"><span className="font-medium">Email:</span> {user?.email}</div>
        <div className="mb-2"><span className="font-medium">Role:</span> {user?.role}</div>
      </div>
    </div>
  );
}


