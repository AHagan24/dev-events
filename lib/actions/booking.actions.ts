"use server";

import connectDB from "../mogodb";
import Booking from "@/database/booking.model";

export const createBooking = async ({
  eventId,
  slug,
  email,
}: {
  eventId: string;
  slug: string;
  email: string;
}) => {
  try {
    await connectDB();
    await Booking.create({ eventId, slug, email });

    return { success: true, message: null };
  } catch (e) {
    console.error(" Failed to create booking:", e);

    if (e && typeof e === "object" && "code" in e && e.code === 11000) {
      return {
        success: false,
        message: "This email has already booked this event.",
      };
    }

    if (e instanceof Error) {
      return { success: false, message: e.message };
    }

    return { success: false, message: "Unable to create booking." };
  }
};
