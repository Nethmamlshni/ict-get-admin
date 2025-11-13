"use client";
import { useEffect, useState, useMemo } from "react";
import { FaTrash, FaCheckCircle, FaClock, FaPhoneAlt, FaTicketAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Fetch bookings
  useEffect(() => {
    let mounted = true;
    async function fetchBookings() {
      try {
        const res = await fetch("/api/admin/bookings");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch bookings");
        }

        if (mounted) {
          setBookings(data.bookings || []);
          setFilteredBookings(data.bookings || []);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError(err.message || "Error fetching bookings");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchBookings();
    return () => { mounted = false; };
  }, []);

  // Search filter (firstname, lastname, ticket number, year, enrollment number)
  useEffect(() => {
    if (!search) {
      setFilteredBookings(bookings);
      return;
    }
    const lower = search.toLowerCase();
    setFilteredBookings(
      bookings.filter((b) => {
        const first = String(b.firstname ?? "").toLowerCase();
        const last = String(b.lastname ?? "").toLowerCase();
        const ticket = String(b.ticketNumber ?? "").toLowerCase();
        const enrol = String(b.enrollmentnumber ?? "").toLowerCase();
        const phone = String(b.phone ?? "").toLowerCase();
        return (
          first.includes(lower) ||
          last.includes(lower) ||
          ticket.includes(lower) ||
          enrol.includes(lower) ||
          phone.includes(lower)
        );
      })
    );
  }, [search, bookings]);

  // Toggle payment status (optimistic + toast)
  async function handleTogglePayment(bookingId) {
    const current = bookings.find((b) => b._id === bookingId);
    if (!current) return toast.error("Booking not found");

    const newStatus = current.paymentStatus === "paid" ? "pending" : "paid";

    // optimistic update
    setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, paymentStatus: newStatus } : b)));
    setFilteredBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, paymentStatus: newStatus } : b)));

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

      toast.success(`Payment marked ${newStatus}`);
    } catch (err) {
      console.error(err);
      // rollback on error
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, paymentStatus: current.paymentStatus } : b)));
      setFilteredBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, paymentStatus: current.paymentStatus } : b)));
      toast.error("Error updating payment status: " + (err.message || err));
    }
  }

  // Delete booking
  async function handleDelete(bookingId) {
    const ok = confirm("Are you sure you want to delete this booking? This cannot be undone.");
    if (!ok) return;

    // optimistic remove
    const prevBookings = bookings;
    setBookings((prev) => prev.filter((b) => b._id !== bookingId));
    setFilteredBookings((prev) => prev.filter((b) => b._id !== bookingId));

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete booking");
      }

      toast.success("Booking deleted");
    } catch (err) {
      console.error(err);
      // rollback
      setBookings(prevBookings);
      setFilteredBookings(prevBookings);
      toast.error("Error deleting booking: " + (err.message || err));
    }
  }

  const noResults = !loading && filteredBookings.length === 0;

  // Simple loading skeleton rows count
  const skeletonRows = useMemo(() => Array.from({ length: 4 }), []);

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-4 text-center">All Bookings</h1>
        <div className="space-y-3">
          {skeletonRows.map((_, i) => (
            <div key={i} className="animate-pulse border rounded p-4">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-4 text-center">All Bookings</h1>
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4 text-center">All Bookings</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          aria-label="Search bookings"
          placeholder="Search by name, ticket, phone or enrollment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* MOBILE: card list */}
      <div className="space-y-3 sm:hidden">
        {filteredBookings.map((b, index) => (
          <article
            key={b._id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
            role="group"
            aria-labelledby={`booking-${b._id}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id={`booking-${b._id}`} className="font-semibold text-lg">
                  {b.firstname} {b.lastname ?? ""}
                </h2>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <FaTicketAlt className="inline" /> {b.ticketNumber ?? "—"}
                </p>
              </div>

              <div className="text-right">
                <div
                  className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                    b.paymentStatus === "paid" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                  }`}
                >
                  {b.paymentStatus}
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-700 space-y-1">
              <p className="flex items-center gap-2">
                <FaPhoneAlt className="inline" /> {b.phone ?? "—"}
              </p>
              <p>Enrollment: <span className="font-medium">{b.enrollmentnumber || "—"}</span></p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => handleTogglePayment(b._id)}
                title={b.paymentStatus === "paid" ? "Mark Pending" : "Mark Paid"}
                className="flex items-center gap-2 px-3 py-1 rounded border hover:bg-gray-100 transition"
                aria-pressed={b.paymentStatus === "paid"}
              >
                {b.paymentStatus === "paid" ? <FaClock /> : <FaCheckCircle />}
                <span className="text-sm">{b.paymentStatus === "paid" ? "Mark Pending" : "Mark Paid"}</span>
              </button>

              <button
                onClick={() => handleDelete(b._id)}
                title="Delete Booking"
                className="flex items-center gap-2 px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition"
              >
                <FaTrash />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </article>
        ))}

        {noResults && (
          <div className="text-center py-8 text-gray-500">No bookings found</div>
        )}
      </div>

      {/* TABLE for tablet+ */}
      <div className="hidden sm:block overflow-x-auto rounded-lg shadow-md">
        <table className="w-full border border-gray-300 text-sm md:text-base">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 w-12">No</th>
              <th className="border p-2">Ticket No</th>
              <th className="border p-2">Firstname</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Enrollment</th>
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
                  <td className="border p-2">{b.firstname}{b.lastname ? ` ${b.lastname}` : ""}</td>
                  <td className="border p-2">{b.phone || "—"}</td>
                  <td className="border p-2">{b.enrollmentnumber || "—"}</td>
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
                    <button
                      onClick={() => handleTogglePayment(b._id)}
                      title={b.paymentStatus === "paid" ? "Mark Pending" : "Mark Paid"}
                      className={`p-2 rounded hover:bg-gray-200 transition ${
                        b.paymentStatus === "paid" ? "text-yellow-500" : "text-green-500"
                      }`}
                    >
                      {b.paymentStatus === "paid" ? <FaClock size={18} /> : <FaCheckCircle size={18} />}
                    </button>

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
