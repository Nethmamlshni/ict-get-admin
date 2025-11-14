import dbConnect from "../../../lib/mongoose";
import Booking from "../../../models/booking";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // e.g., 'paid', 'pending', 'transport', etc.
    if (!type) {
      return new Response(JSON.stringify({ success: false, error: "type query param is required" }), { status: 400 });
    }

    let filter = {};

switch (type) {
  case "paid":
    filter = { paymentStatus: "paid" }; // model matches
    break;
  case "pending":
    filter = { paymentStatus: "pending" };
    break;
  case "transportYes":
    filter = { campusbus: true }; // correct field
    break;
  case "hostelYes":
    filter = { boarding: true }; // correct field
    break;
  case "all":
  case "allTickets":
    filter = {}; // all bookings
    break;
  default:
    return new Response(JSON.stringify({ success: false, error: "Unknown type" }), { status: 400 });
}


   const users = await Booking.find(filter)
  .select("firstname lastname ticketNumber email phone enrollmentnumber year boarding campusbus paymentStatus")
  .lean();

    return new Response(JSON.stringify({ success: true, data: users }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
