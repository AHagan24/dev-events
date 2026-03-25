import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mogodb";
import { v2 as cloudinary } from "cloudinary";
import Event from "@/database/event.model";

function parseStringArrayField(
  formData: FormData,
  fieldName: string,
): string[] {
  const rawValues = formData
    .getAll(fieldName)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  if (rawValues.length === 0) {
    return [];
  }

  if (rawValues.length > 1) {
    return rawValues;
  }

  const [rawValue] = rawValues;

  try {
    const parsed = JSON.parse(rawValue);

    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Fall through to plain-text parsing for textarea and comma-separated inputs.
  }

  return rawValue
    .split(/\r?\n|,/)
    .map((item) => item.replace(/^[\[\]"\s]+|[\[\]"\s]+$/g, "").trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();

    let event;

    try {
      event = Object.fromEntries(formData.entries());
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid JSON data format" },
        { status: 400 },
      );
    }
    const file = formData.get("image") as File;

    if (!file)
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 },
      );

    const tags = parseStringArrayField(formData, "tags");
    const agenda = parseStringArrayField(formData, "agenda");

    if (tags.length === 0) {
      return NextResponse.json(
        { message: "At least one tag is required" },
        { status: 400 },
      );
    }

    if (agenda.length === 0) {
      return NextResponse.json(
        { message: "At least one agenda item is required" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "EventDev" },
          (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          },
        )
        .end(buffer);
    });

    event.image = (uploadResult as { secure_url: string }).secure_url;

    const createdEvent = await Event.create({
      ...event,
      tags: tags,
      agenda: agenda,
    });

    return NextResponse.json(
      { message: "Event Created Successfully", event: createdEvent },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({
      message: "Event Creation Failed",
      error: e ? (e instanceof Error ? e.message : "Unknown") : "Unknown",
    });
  }
}

export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().sort({ createdAt: -1 });
    return NextResponse.json(
      { message: "Events fetched successfully", events },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Event fetching failed", error: e },
      { status: 500 },
    );
  }
}
