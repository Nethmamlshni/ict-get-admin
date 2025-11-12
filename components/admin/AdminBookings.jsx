"use client";
import { useEffect, useState } from "react";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // ✅ Fetch bookings from API
  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch("/api/admin/bookings");
        const data = await res.json();

        if (res.ok) {
          setBookings(data.bookings);
          setFilteredBookings(data.bookings);
        } else {
          setError(data.message || "Failed to fetch bookings");
        }
      } catch (err) {
        setError("Error fetching bookings");
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  // 🔍 Search filter (firstname, lastname, ticket number)
  useEffect(() => {
    if (!search) {
      setFilteredBookings(bookings);
    } else {
      const lower = search.toLowerCase();
      setFilteredBookings(
        bookings.filter(
          (b) =>
            b.firstname?.toLowerCase().includes(lower) ||
            b.lastname?.toLowerCase().includes(lower) ||
            b.ticketNumber?.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, bookings]);

  // 💳 Update payment status
  async function handleMarkPaid(bookingId) {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });

      const data = await res.json();
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId ? { ...b, paymentStatus: "paid" } : b
          )
        );
      } else {
        alert(data.message || "Failed to update payment status");
      }
    } catch (err) {
      alert("Error updating payment status");
      console.error(err);
    }
  }

  if (loading) return <p>Loading bookings...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  // ✅ Table + Responsive Design
  return (
    <div className="p-4 max-w-6xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">All Bookings</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or ticket number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 p-2 rounded w-full"
        />
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="w-full border border-gray-300 text-sm md:text-base">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 w-16">No</th>
              <th className="border p-2">Ticket No</th>
              <th className="border p-2">Firstname</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Payment Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((b, index) => (
                <tr
                  key={b._id}
                  className="text-center border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2 font-semibold text-blue-600">
                    {b.ticketNumber || "—"}
                  </td>
                  <td className="border p-2">{b.firstname}</td>
                  <td className="border p-2">{b.email}</td>
                  <td className="border p-2">{b.phone}</td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        b.paymentStatus === "paid"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {b.paymentStatus}
                    </span>
                    {b.paymentStatus === "pending" && (
                      <button
                        onClick={() => handleMarkPaid(b._id)}
                        className="ml-2 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
