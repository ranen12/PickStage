
import { apiFetch } from '@/lib/api';
import { ScheduleResponse } from '@/types/api/apiSchedule';

import ScheduleForm from './schedule-form';

type Props = { params: Promise<{ id: string }> };

export default async function SchedulePage({ params }: Props) {
  const { id } = await params;

  const stage = await apiFetch<ScheduleResponse>({
    path: `/schedule/${id}`,
  })

  return <ScheduleForm stage={stage} />;
}