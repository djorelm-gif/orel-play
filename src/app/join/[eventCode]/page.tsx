import { notFound } from 'next/navigation';
import { dataSource } from '@/lib/data-source';
import { JoinForm } from '@/components/player/JoinForm';

export const dynamic = 'force-dynamic';

export default async function JoinPage({ params }: { params: { eventCode: string } }) {
  const event = await dataSource.getEventByCode(params.eventCode);
  if (!event) return notFound();
  return <JoinForm event={event} />;
}
