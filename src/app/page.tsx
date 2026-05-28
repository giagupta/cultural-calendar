import { queryEvents } from "@/lib/db";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const events = await queryEvents();
  return (
    <main className="min-h-screen bg-paper">
      <Dashboard initialEvents={events} />
    </main>
  );
}
