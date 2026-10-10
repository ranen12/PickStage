import Image from 'next/image';

import PageHeader from '@/components/layout/page-header';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function Stages() {
  return (
    <>
      <PageHeader title="공연 상세" />
      <div className="flex flex-col gap-4 px-4 py-8">
        <div className="border-b-1 border-b-gray-200 py-4">
          <div className="pb-2">
            <strong className="">[연극]</strong>
            <h2 className="text-2xl font-bold">연극 라면</h2>
          </div>
          <p className="text-sm text-gray-500">2026.06.15~2026.06.20 | PickStage HALL</p>
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="md:w-1/3">
            <Image
              src="https://tkfile.yes24.com/upload2/perfblog/202608/20260825/20260825-49515.jpg/dims/quality/70/"
              alt="공연 1"
              width={600}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-4 md:w-2/3">
            <dl className="grid grid-cols-[100px_1fr] gap-4">
              <dt className="text-sm font-medium text-gray-500">등급</dt>
              <dd className="text-sm text-gray-900">전체관람가</dd>
              <dt className="text-sm font-medium text-gray-500">관람시간</dt>
              <dd className="text-sm text-gray-900">120분</dd>
              <dt className="text-sm font-medium text-gray-500">가격</dt>
              <dd className="text-sm text-gray-900">24,000원</dd>
            </dl>
            <Separator className="my-2" />
            <div className="">
              <p className="text-sm text-gray-500 pb-2">
                공연 소개
              </p>
              <p className="text-sm text-gray-900">
                연극 라면은 현대 사회의 복잡한 인간관계와 감정의 얽힘을 다룬 연극으로, 관객들에게 깊은 공감과 생각할 거리를 제공합니다. 다양한 캐릭터들의 이야기를 통해 인간의 본성과 사회적 갈등을 탐구하며, 감동적인 메시지를 전달합니다.
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
