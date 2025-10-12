"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditUserProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setName(data.user?.name || "");
        setEmail(data.user?.email || "");
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true); setError(null); setMessage(null);
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMessage("Profile updated");
      setTimeout(() => router.push("/dashboard/user/profile"), 700);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Edit Profile</h1>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {message && <div className="mb-3 text-green-700">{message}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="border rounded p-2 w-full" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input className="border rounded p-2 w-full bg-gray-100" value={email} disabled />
        </div>
        <button disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving?"Saving...":"Save"}</button>
      </form>
    </div>
  );
}


