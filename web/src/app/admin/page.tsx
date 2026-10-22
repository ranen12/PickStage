import Link from 'next/link';
import Image from 'next/image';

import { apiFetch } from '@/lib/api';
import { formatDateToDot } from '@/lib/formatDate';
import { StageListResponse } from '@/types/api/apiStage';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type Props = {
  searchParams: Promise<{
    sort?: string;
    missingSchedules?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 10;
const DEFAULT_IMAGE = 'https://placehold.co/400x600/png';

export default async function AdminList({ searchParams }: Props) {
  const params = await searchParams;
  const sort = params.sort === 'name' ? 'name' : 'latest';
  const onlyMissingSchedules = params.missingSchedules === 'true';
  const requestedPage = Math.max(1, Number(params.page) || 1);

  const stages = await apiFetch<StageListResponse[]>({
    path: '/stage',
  });

  const filteredStages = stages.filter(
    (stage) => !onlyMissingSchedules || stage._count.schedules === 0,
  );

  const sortedStages = [...filteredStages].sort((a, b) =>
    sort === 'name'
      ? a.title.localeCompare(b.title, 'ko')
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const totalPages = Math.max(1, Math.ceil(sortedStages.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStages = sortedStages.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function makeUrl(
    options: {
      sort?: string;
      missingSchedules?: boolean;
      page?: number;
    } = {},
  ) {
    const nextSort = options.sort ?? sort;
    const nextMissing = options.missingSchedules ?? onlyMissingSchedules;
    const nextPage = options.page ?? 1;

    const query = new URLSearchParams();
    query.set('sort', nextSort);

    if (nextMissing) {
      query.set('missingSchedules', 'true');
    }

    query.set('page', String(nextPage));
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
            {onlyMissingSchedules
              ? `스케줄 미등록 공연 ${filteredStages.length}개`
              : `공연 ${stages.length}개`}
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

          <Link
            href={makeUrl({
              missingSchedules: !onlyMissingSchedules,
            })}
            className='inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground'
          >
            {onlyMissingSchedules
              ? '전체 공연 보기'
              : '스케줄 미등록 공연만 보기'}
          </Link>
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
        <nav
          aria-label="공연 목록 페이지"
          className="flex items-center justify-center gap-3 pt-4"
        >
          <Button asChild variant="outline" disabled={currentPage <= 1}>
            <Link href={makeUrl({ page: currentPage - 1 })}>이전</Link>
          </Button>

          <span className="text-sm">
            {currentPage} / {totalPages}
          </span>

          <Button
            asChild
            variant="outline"
            disabled={currentPage >= totalPages}
          >
            <Link href={makeUrl({ page: currentPage + 1 })}>다음</Link>
          </Button>
        </nav>
      )}
    </div>
  );
}
