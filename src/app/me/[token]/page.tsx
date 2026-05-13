import { notFound } from 'next/navigation';
import { dataSource } from '@/lib/data-source';
import { Wizard } from '@/components/bat-mitzvah-wizard/Wizard';

export const dynamic = 'force-dynamic';

export default async function MePage({ params }: { params: { token: string } }) {
  const event = await dataSource.getEventByHostToken(params.token);
  if (!event) return notFound();
  const profile = await dataSource.getProfile(event.id);
  return (
    <Wizard
      token={params.token}
      childName={event.child_name}
      initialAnswers={(profile?.answers as Record<string, string | string[]>) ?? {}}
    />
  );
}
