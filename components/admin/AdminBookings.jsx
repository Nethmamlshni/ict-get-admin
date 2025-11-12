"use client";
import { useEffect, useState } from "react";
import { FaTrash, FaCheckCircle, FaClock } from "react-icons/fa";
import { toast } from "react-hot-toast";


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
        console.error(err);
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

  // 💳 Toggle payment status (paid <-> pending)
  async function handleTogglePayment(bookingId) {
    const current = bookings.find((b) => b._id === bookingId);
    if (!current) return;

    const newStatus = current.paymentStatus === "paid" ? "pending" : "paid";

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update payment status");
      }

      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, paymentStatus: newStatus } : b))
      );
    } catch (err) {
      console.error(err);
      alert("Error updating payment status: " + (err.message || err));

    }
  }

  // 🗑️ Delete booking
  async function handleDelete(bookingId) {
    if (!confirm("Are you sure you want to delete this booking? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete booking");
      }

      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
      setFilteredBookings((prev) => prev.filter((b) => b._id !== bookingId));
    } catch (err) {
      console.error(err);
      toast.error("Error deleting booking: " + (err.message || err));
    }
  }

  if (loading) return <p>Loading bookings...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

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
              <th className="border p-2">Phone</th>
              <th className="border p-2">Payment Status</th>
              <th className="border p-2">Actions</th>
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
                  <td className="border p-2">{b.firstname} {b.lastname ? ` ${b.lastname}` : ""}</td>
                  <td className="border p-2">{b.phone}</td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        b.paymentStatus === "paid" ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    >
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="border p-2 flex justify-center space-x-2">
                    {/* Toggle Payment */}
                    <button
                      onClick={() => handleTogglePayment(b._id)}
                      title={b.paymentStatus === "paid" ? "Mark Pending" : "Mark Paid"}
                      className={`p-2 rounded hover:bg-gray-200 transition ${
                        b.paymentStatus === "paid" ? "text-yellow-500" : "text-green-500"
                      }`}
                    >
                      {b.paymentStatus === "paid" ? <FaClock size={18} /> : <FaCheckCircle size={18} />}
                    </button>

                    {/* Delete Booking */}
                    <button
                      onClick={() => handleDelete(b._id)}
                      title="Delete Booking"
                      className="p-2 rounded text-red-500 hover:bg-gray-200 transition"
                    >
                      <FaTrash size={18} />
                    </button>
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
