import { notFound } from "next/navigation";
import Image from "next/image";
import BookEvent from "@/components/BookEvent";
import { IEvent } from "@/database/event.model";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import EventCard from "@/components/EventCard";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

function parseSerializedAgenda(value: string): string[] {
  try {
    const parsedAgenda = JSON.parse(value);
    if (Array.isArray(parsedAgenda)) {
      return parsedAgenda.filter(
        (item): item is string => typeof item === "string",
      );
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
    .split(/\r?\n/)
    .map((item) => item.replace(/^[\[\]",\s]+|[\[\]",\s]+$/g, "").trim())
    .filter(Boolean);
}

function normalizeAgenda(agenda: unknown): string[] {
  if (!Array.isArray(agenda)) {
    return [];
  }

  if (agenda.length === 1 && typeof agenda[0] === "string") {
    const firstItem = agenda[0].trim();

    if (firstItem.startsWith("[")) {
      return parseSerializedAgenda(firstItem);
    }
  }

  if (agenda.every((item) => typeof item === "string")) {
    return agenda;
  }

  return [];
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  if (tags.length === 1 && typeof tags[0] === "string") {
    const firstItem = tags[0].trim();

    if (firstItem.startsWith("[")) {
      return parseSerializedAgenda(firstItem);
    }
  }

  return tags.filter((item): item is string => typeof item === "string");
}

const EventDetailItem = ({
  icon,
  alt,
  label,
}: {
  icon: string;
  alt: string;
  label: string;
}) => (
  <div className="flex-row-gap-items-center">
    <Image src={icon} alt={alt} width={17} height={17} />
    <p>{label}</p>
  </div>
);

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
  <div className="agenda">
    <h2>Agenda</h2>
    <ul>
      {agendaItems.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </div>
);

const EventTags = ({ tags }: { tags: string[] }) => (
  <div className="flex flex-row gap-1.5 flex-wrap">
    {tags.map((tag) => (
      <div className="pill" key={tag}>
        {tag}
      </div>
    ))}
  </div>
);

const EventDetailsPage = async ({ params }: { params: { slug: string } }) => {
  const { slug } = await params;
  const request = await fetch(`${baseUrl}/api/events/${slug}`);
  const {
    event: {
      description,
      image,
      overview,
      date,
      time,
      location,
      mode,
      agenda,
      audience,
      tags,
      organizer,
    },
  } = await request.json();
  const agendaItems = normalizeAgenda(agenda);
  const tagItems = normalizeTags(tags);

  if (!description) return notFound();

  const bookings = 10;

  const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);

  return (
    <section id="event">
      <div className="header">
        <h1>Event Description</h1>
        <p>{description}</p>
      </div>

      <div className="details">
        {/* {Left Side - Event Details} */}
        <div className="content">
          <Image
            src={image}
            alt="Event Banner"
            width={800}
            height={800}
            className="banner"
          />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event Details</h2>
            <EventDetailItem
              icon="/icons/calendar.svg"
              alt="Date Icon"
              label={date}
            />
            <EventDetailItem
              icon="/icons/clock.svg"
              alt="Time Icon"
              label={time}
            />
            <EventDetailItem
              icon="/icons/pin.svg"
              alt="Location Icon"
              label={location}
            />
            <EventDetailItem
              icon="/icons/mode.svg"
              alt="Mode Icon"
              label={mode}
            />
            <EventDetailItem
              icon="/icons/audience.svg"
              alt="Audience Icon"
              label={audience}
            />
          </section>
          <EventAgenda agendaItems={agendaItems} />

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={tagItems} />
        </div>
        {/* {Right Side - Booking Form} */}
        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} others who have booked this event. Don't miss
                out!
              </p>
            ) : (
              <p className="text-sm">Be the first to book this event!</p>
            )}

            <BookEvent />
          </div>
        </aside>
      </div>
      <div className="flex w-full flex-col gap-4 pt-20">
        <h2>Similar Events You Might Like</h2>
        <div className="events">
          {similarEvents.length > 0 &&
            similarEvents.map((similarEvent: IEvent) => (
              <EventCard key={similarEvent.title} {...similarEvent} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default EventDetailsPage;
