import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Event, { type IEvent } from "@/database/event.model";
import connectDB from "@/lib/mogodb";

type RouteContext = {
  params: Promise<{
    slug?: string;
  }>;
};

type ErrorBody = {
  message: string;
};

type EventResponseBody = {
  message: string;
  event: IEvent;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function jsonError(message: string, status: number) {
  return NextResponse.json<ErrorBody>({ message }, { status });
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { slug } = await context.params;

    if (typeof slug !== "string" || slug.trim().length === 0) {
      return jsonError("A valid event slug is required.", 400);
    }

    const normalizedSlug = normalizeSlug(slug);

    if (!isValidSlug(normalizedSlug)) {
      return jsonError(
        "Invalid event slug format. Use lowercase letters, numbers, and hyphens only.",
        400,
      );
    }

    await connectDB();

    // Query by normalized slug so the API is case-insensitive for callers.
    const event = await Event.findOne({ slug: normalizedSlug }).exec();

    if (!event) {
      return jsonError("Event not found.", 404);
    }

    return NextResponse.json<EventResponseBody>(
      {
        message: "Event fetched successfully.",
        event,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof mongoose.Error.ValidationError) {
      return jsonError(error.message, 400);
    }

    if (error instanceof Error) {
      console.error("Failed to fetch event by slug:", error);
    } else {
      console.error("Failed to fetch event by slug:", error);
    }

    return jsonError("An unexpected error occurred while fetching the event.", 500);
  }
}
