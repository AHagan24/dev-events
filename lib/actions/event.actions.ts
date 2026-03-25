"use server";
import Event from "@/database/event.model";
import connectDB from "../mogodb";

function parseSerializedStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    const matches = [...value.matchAll(/"([^"]+)"/g)].map((match) =>
      match[1].trim(),
    );

    if (matches.length > 0) {
      return matches;
    }
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.replace(/^[\[\]",\s]+|[\[\]",\s]+$/g, "").trim())
    .filter(Boolean);
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  if (tags.length === 1 && typeof tags[0] === "string") {
    const firstItem = tags[0].trim();

    if (firstItem.startsWith("[")) {
      return parseSerializedStringArray(firstItem);
    }
  }

  return tags
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const getSimilarEventsBySlug = async (slug: string) => {
  try {
    await connectDB();

    const event = await Event.findOne({ slug }).lean();
    const normalizedTags = normalizeTags(event?.tags);

    if (!event || normalizedTags.length === 0) {
      return [];
    }

    const otherEvents = await Event.find({
      _id: { $ne: event._id },
    })
      .sort({ createdAt: -1 })
      .lean();

    const eventTagSet = new Set(normalizedTags);

    return otherEvents.filter((candidateEvent) =>
      normalizeTags(candidateEvent.tags).some((tag) => eventTagSet.has(tag)),
    );
  } catch (e) {
    return [];
  }
};
