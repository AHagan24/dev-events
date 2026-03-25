import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/ExploreBtn";
import { IEvent } from "@/database";
import { getEvents } from "@/lib/actions/event.actions";
import { cacheLife } from "next/cache";

const Home = async () => {
  'use cache';
  cacheLife('hours');
  const events = await getEvents();
  return (
    <section>
      <h1 className="text-center">The Dashboard for Event Management</h1>
      <p className="text-center mt-5">
        Hackathons, Meetups, Conferences, all in one place.
      </p>
      <ExploreBtn />
      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>
        <ul className="events">
          {events &&
            events.length > 0 &&
            events.map((event: IEvent) => (
              <li key={event.title} className="list-none">
                <EventCard {...event} />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
};

export default Home;
