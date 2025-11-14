"use client";
import { useEffect, useState } from "react";

export default function CheckinStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [details, setDetails] = useState([]); // users details
  const [detailsType, setDetailsType] = useState(""); // which stat clicked
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkin/stats");
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "API returned unsuccessful");
      setStats(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDetails(type) {
    setDetails([]);
    setDetailsType(type);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/checkin/details?type=${type}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch details");
      setDetails(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
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
        <Stat label="Total bookings" value={stats.totalBookings} onClick={() => fetchDetails("all")} />
        <Stat label="Total tickets" value={stats.totalTickets} onClick={() => fetchDetails("allTickets")} />
        <Stat label="Paid" value={stats.paidCount} onClick={() => fetchDetails("paid")} />
        <Stat label="Pending / Unpaid" value={stats.pendingCount} onClick={() => fetchDetails("pending")} />
        <Stat label="Transport (campus bus) yes" value={stats.transportYesCount} onClick={() => fetchDetails("transportYes")} />
        <Stat label="Hostel (boarding) yes" value={stats.hostelYesCount} onClick={() => fetchDetails("hostelYes")} />
      </div>

      {/* Refresh button */}
      <div className="mt-4">
        <button className="px-3 py-2 rounded border" onClick={fetchStats}>Refresh</button>
      </div>

      {/* Details List */}
      {detailsType && (
        <div className="mt-4 border-t pt-3">
          <h4 className="font-semibold mb-2">Details: {detailsType}</h4>
          {detailsLoading ? (
            <div>Loading details…</div>
          ) : details.length === 0 ? (
            <div>No users found.</div>
          ) : (
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {details.map((user, idx) => (
                <li key={idx} className="p-2 border rounded flex justify-between">
                  <div>
                    {user.firstname} {user.lastname} - {user.enrollmentnumber}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-2 border rounded cursor-pointer hover:bg-gray-50"
    >
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value ?? 0}</div>
    </div>
  );
}
