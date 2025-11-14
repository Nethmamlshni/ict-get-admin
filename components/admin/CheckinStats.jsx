// src/components/CheckinStats.jsx
"use client";
import { useEffect, useState } from "react";

export default function CheckinStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkin/stats");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "API returned unsuccessful");
      setStats(json.data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div className="p-4">Loading stats…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 max-w-lg bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Booking & Ticket Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total bookings" value={stats.totalBookings} />
        <Stat label="Total tickets" value={stats.totalTickets} />
        <Stat label="Paid" value={stats.paidCount} />
        <Stat label="Pending / Unpaid" value={stats.pendingCount} />
        <Stat label="Transport (campus bus) yes" value={stats.transportYesCount} />
        <Stat label="Hostel (boarding) yes" value={stats.hostelYesCount} />
      </div>
      <div className="mt-4">
        <button className="px-3 py-2 rounded border" onClick={fetchStats}>Refresh</button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-2 border rounded">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value ?? 0}</div>
    </div>
  );
}
