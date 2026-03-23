import { notFound } from "next/navigation";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

const EventDetailsPage = async ({ params }: { params: { slug: string } }) => {
  const { slug } = await params;
  const request = await fetch(`${baseUrl}/api/events/${slug}`);
  const { event } = await request.json();

  if (!event) return notFound();
  return (
    <section id="event">
      <h1>
        Event Details: <br /> {slug}
      </h1>
    </section>
  );
};

export default EventDetailsPage;
