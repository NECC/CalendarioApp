import { EventCalendar } from "./components/calendar/EventCalendar";

const PLACEHOLDER_EVENTS = [
  {
    id: "1",
    title: "Event 1",
    description: "This is the description for event 1",
    startTimestampnz: "2026-10-01T10:00:00",
    endTimestampnz: "2026-10-01T10:00:00",
    category: "exam"
  },
  {
    id: "2",
    title: "Event 2",
    description: "This is the description for event 2",
    startTimestampnz: "2026-10-02T10:00:00",
    endTimestampnz: "2026-10-02T10:00:00",
    category: "event"
  }
]
export default function Home() {
  return (
    <main style={{display: "flex", width: "100%", minHeight: "100vh"}}>
      <EventCalendar initialEvents={[...PLACEHOLDER_EVENTS]}/>
    </main>
  );

}
