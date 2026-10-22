import Link from 'next/link';
import Image from 'next/image';

import { apiFetch } from '@/lib/api';
import { formatDateToDot } from '@/lib/formatDate';
import { StageListResponse } from '@/types/api/apiStage';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type ScheduleStatusType = 'all' | 'registered' | 'missing';

type Props = {
  searchParams: Promise<{
    sort?: string;
    scheduleStatus?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 10;
const DEFAULT_IMAGE = 'https://placehold.co/400x600/png';

export default async function AdminList({ searchParams }: Props) {
  const params = await searchParams;
  const sort = params.sort === 'name' ? 'name' : 'latest';
  const scheduleStatus : ScheduleStatusType =
    params.scheduleStatus === 'registered' ||
    params.scheduleStatus === 'missing'
      ? params.scheduleStatus
      : 'all';
  const requestedPage = Math.max(1, Number(params.page) || 1);

  const apiQuery = new URLSearchParams({
    sort,
    page: String(requestedPage),
    limit: String(PAGE_SIZE),
  });

  if (scheduleStatus !== 'all') {
    apiQuery.set('scheduleStatus', scheduleStatus);
  }

  const stages = await apiFetch<StageListResponse>({
    path: `/stage?${apiQuery.toString()}`,
  });

  const currentPage = stages.page;
  const totalPages = stages.totalPages;
  const pageStages = stages.data;

  const paginationItems: (number | 'left-ellipsis' | 'right-ellipsis')[] =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : currentPage <= 3
        ? [1, 2, 3, 4, 'right-ellipsis', totalPages]
        : currentPage >= totalPages - 2
          ? [
              1,
              'left-ellipsis',
              totalPages - 3,
              totalPages - 2,
              totalPages - 1,
              totalPages,
            ]
          : [
              1,
              'left-ellipsis',
              currentPage - 1,
              currentPage,
              currentPage + 1,
              'right-ellipsis',
              totalPages,
            ];

  function makeUrl(
    options: {
      sort?: 'latest' | 'name';
      scheduleStatus?: ScheduleStatusType;
      page?: number;
    } = {},
  ) {
    const nextSort = options.sort ?? sort;
    const nextStatus = options.scheduleStatus ?? scheduleStatus;
    const nextPage = options.page ?? 1;

    const query = new URLSearchParams();
    query.set('sort', nextSort);
    query.set('page', String(nextPage));

    if(nextStatus !== 'all'){
      query.set('scheduleStatus', nextStatus);
    }
    return `?${query.toString()}`;
  }

  const sortLinkClass = (active: boolean) =>
    [
      'inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
        : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ].join(' ');

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">공연 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            공연은 총 <strong>{stages.total}</strong>개 있습니다
          </p>
        </div>

        <Link
          href="/admin/new"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          공연 등록하기
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href={makeUrl({ sort: 'latest' })}
            className={sortLinkClass(sort === 'latest')}
          >
            최신 등록순
          </Link>

          <Link
            href={makeUrl({ sort: 'name' })}
            className={sortLinkClass(sort === 'name')}
          >
            이름순
          </Link>
        </div>

        <div>
          <Link href={makeUrl({ scheduleStatus: 'all' })}>전체</Link>
          <Link href={makeUrl({ scheduleStatus: 'registered' })}>
            스케줄 등록됨
          </Link>
          <Link href={makeUrl({ scheduleStatus: 'missing' })}>
            스케줄 미등록
          </Link>
        </div>
      </div>

      <Separator />

      {pageStages.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          표시할 공연이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pageStages.map((stage) => (
            <Card key={stage.id} className="overflow-hidden py-0">
              <Link href={`/stages/${stage.id}`}>
                <div className="relative aspect-[3/4] bg-muted">
                  <Image
                    src={stage.posterUrl || DEFAULT_IMAGE}
                    alt={stage.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>

                <CardContent className="space-y-2 p-4">
                  <h2 className="truncate font-semibold">{stage.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatDateToDot(stage.startDate)} ~{' '}
                    {formatDateToDot(stage.endDate)}
                  </p>
                </CardContent>
              </Link>

              {stage._count.schedules === 0 && (
                <div className="px-4 pb-4">
                  <Link
                    href={`/admin/schedules/${stage.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    스케줄 등록
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious href={makeUrl({ page: currentPage - 1 })} />
              </PaginationItem>
            )}
            {paginationItems.map((item) =>
              typeof item === 'number' ? (
                <PaginationItem key={item}>
                  <PaginationLink
                    href={makeUrl({ page: item })}
                    isActive={item === currentPage}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationEllipsis />
                </PaginationItem>
              ),
            )}
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext href={makeUrl({ page: currentPage + 1 })} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
