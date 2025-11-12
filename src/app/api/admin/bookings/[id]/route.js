import dbConnect from "../../../../lib/mongoose";
import Booking from "../../../../models/booking";

export async function PUT(req, context) {
  try {
    await dbConnect();

    // in app router, context.params might be a promise
    const params = await context.params;
    const { id } = params;

    const body = await req.json();
    const { paymentStatus } = body;

    // Validate paymentStatus
    if (!["paid", "pending"].includes(paymentStatus)) {
      return new Response(
        JSON.stringify({ message: "Invalid paymentStatus value" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    );

    if (!booking) {
      return new Response(
        JSON.stringify({ message: "Booking not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Payment status updated", booking }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ message: err.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(req, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const { id } = params;

    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return new Response(
        JSON.stringify({ message: "Booking not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Booking deleted", bookingId: id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ message: err.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
