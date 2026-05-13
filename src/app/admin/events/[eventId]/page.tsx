import { redirect } from 'next/navigation';

export default function EventIndex({ params }: { params: { eventId: string } }) {
  redirect(`/admin/events/${params.eventId}/host`);
}
