import { notFound } from 'next/navigation';
import { dataSource } from '@/lib/data-source';
import { ModerationPage } from '@/components/admin/ModerationPage';

export const dynamic = 'force-dynamic';

export default async function ModerationRoute({ params }: { params: { eventId: string } }) {
  const event = await dataSource.getEventById(params.eventId);
  if (!event) return notFound();
  const greetings = await dataSource.listGreetings(event.id);
  return <ModerationPage event={event} initial={greetings} />;
}
