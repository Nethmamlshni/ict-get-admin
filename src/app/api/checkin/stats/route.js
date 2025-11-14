// src/app/api/checkin/stats/route.js
import dbConnect from "../../../lib/mongoose";
import Booking from "../../../models/booking"; // match your actual filename

export async function GET(req) {
  try {
    await dbConnect();

    // Aggregate using the actual schema field names:
    // - transport = campusbus (boolean)
    // - hostel = boarding (boolean)
    // - paymentStatus enum uses "paid" and "pending"
    const agg = await Booking.aggregate([
      {
        $project: {
          // no numeric ticket field in schema -> treat each booking as 1 ticket
          ticketCount: 1, // if you later add numeric field, aggregation will use it
          paymentStatus: { $toLower: { $ifNull: ["$paymentStatus", ""] } },
          campusbusFlag: { $cond: [{ $eq: ["$campusbus", true] }, true, false] },
          boardingFlag: { $cond: [{ $eq: ["$boarding", true] }, true, false] },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          // totalTickets: if ticketCount exists and is numeric use it, otherwise count 1 per booking
          totalTickets: {
            $sum: {
              $cond: [
                { $and: [{ $ifNull: ["$ticketCount", false] }, { $isNumber: "$ticketCount" }] },
                "$ticketCount",
                1,
              ],
            },
          },
          paidCount: {
            $sum: { $cond: [{ $in: ["$paymentStatus", ["paid", "completed", "success", "succeeded"]] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $in: ["$paymentStatus", ["pending", "unpaid", "failed", "awaiting_payment", ""]] }, 1, 0] },
          },
          transportYesCount: { $sum: { $cond: ["$campusbusFlag", 1, 0] } },
          hostelYesCount: { $sum: { $cond: ["$boardingFlag", 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalBookings: 1,
          totalTickets: 1,
          paidCount: 1,
          pendingCount: 1,
          transportYesCount: 1,
          hostelYesCount: 1,
        },
      },
    ]);

    const result = agg[0] || {
      totalBookings: 0,
      totalTickets: 0,
      paidCount: 0,
      pendingCount: 0,
      transportYesCount: 0,
      hostelYesCount: 0,
    };

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Checkin stats error:", err);
    return new Response(JSON.stringify({ success: false, error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
