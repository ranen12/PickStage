import Image from 'next/image';

import { apiFetch } from '@/lib/api';
import { getCategory, getViewGrade } from '@/types/enums';
import { StageOneResponse } from '@/types/api/apiStage';
import { formatDateToDot } from '@/lib/formatDate';

import PageHeader from '@/components/layout/page-header';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

type Props = {
  params: Promise<{ stageId: string }>;
};

const DEFAULT_IMAGE = 'https://placehold.co/400x600/png';

export default async function Stages({ params }: Props) {
  const { stageId } = await params;

  const stage = await apiFetch<StageOneResponse>({
    path: `/stage/${stageId}`,
  })


  return (
    <>
      <PageHeader title="공연 상세" />
      <div className="flex flex-col gap-4 px-4 py-8">
        <div className="border-b-1 border-b-gray-200 py-4 text-center">
          <div className="pb-2">
            <strong className="">[{getCategory(stage.category)}]</strong>
            <h2 className="text-2xl font-bold">{stage.title}</h2>
          </div>
          <p className="text-sm text-gray-500">{formatDateToDot(stage.startDate)}~{formatDateToDot(stage.endDate)} | PickStage HALL</p>
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="md:w-1/3">
            <Image
              src={stage.posterUrl || DEFAULT_IMAGE}
              alt={`${stage.title} 포스터`}
              width={600}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-4 md:w-2/3">
            <dl className="grid grid-cols-[100px_1fr] gap-4">
              <dt className="text-sm font-medium text-gray-500">등급</dt>
              <dd className="text-sm text-gray-900">{getViewGrade(stage.rating)}</dd>
              <dt className="text-sm font-medium text-gray-500">관람시간</dt>
              <dd className="text-sm text-gray-900">{stage.runningTime}분</dd>
              <dt className="text-sm font-medium text-gray-500">가격</dt>
              <dd className="text-sm text-gray-900">{stage.price.toLocaleString('ko-KR')}원</dd>
            </dl>
            <Separator className="my-2" />
            <div className="">
              <p className="text-sm text-gray-500 pb-2">
                공연 소개
              </p>
              <p className="text-sm text-gray-900">
                {stage.description}
              </p>
            </div>
            <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t-1 border-t-gray-200 md:static md:w-auto md:px-0">
              <Button className="w-full md:max-w-xs h-12">예매하기</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
