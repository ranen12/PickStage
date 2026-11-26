'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  addMinutes,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { ChevronDownIcon, MinusIcon } from 'lucide-react';

import PageHeader from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import type {
  ScheduleResponse,
  ScheduleCreateRequest,
} from '@/types/api/apiSchedule';
import type {
  BaseSchedule,
  DayTimes,
  ScheduleException,
  Weekday,
} from '@/types/schedule';

// ---------- 타입 ----------
type ExceptionKind = ScheduleException['kind']; // 'CLOSED' | 'CUSTOM'

type DayKind = 'show' | 'off' | 'none' | 'error';
type DayInfo = {
  kind: DayKind;
  fromException: boolean;
  times: string[];
  registered: string[]; // 이미 등록된 회차 시간 (API 응답)
  label?: string;
  message?: string;
};

// ---------- 상수 ----------
const NONE = '없음'; // Select의 "시간 없음" 값 (빈 문자열 대신 사용)
const WEEKDAYS: Weekday[] = ['월', '화', '수', '목', '금', '토', '일'];
const CAL_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

const EMPTY_TIMES: DayTimes = ['', ''];

const INITIAL_BASIC: BaseSchedule = {
  월: null,
  화: null,
  수: null,
  목: null,
  금: null,
  토: null,
  일: null,
};

const TIME_OPTIONS = Array.from({ length: 27 }, (_, i) => {
  const minutes = 9 * 60 + i * 30; // 09:00 ~ 22:00, 30분 단위
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
});

const KIND_STYLE: Record<DayKind | 'exception' | 'registered', string> = {
  show: 'bg-primary/10',
  exception: 'bg-amber-100 dark:bg-amber-900/30',
  off: 'bg-muted text-muted-foreground',
  none: 'bg-background text-muted-foreground',
  error: 'bg-destructive/10 text-destructive',
  registered: 'bg-sky-100 dark:bg-sky-900/30',
};

// ---------- 유틸 ----------
// 'HH:mm' → 분 단위 숫자
const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// 분 단위 숫자 → 'HH:mm'
const toTimeText = (minutes: number) => {
  const m = minutes % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

// 1회차/2회차 검증. 문제 없으면 error는 null
function checkTimes(
  t1: string,
  t2: string,
  runningTime: number,
): { times: string[]; error: string | null } {
  if (!t1 && t2) return { times: [], error: '2회차만 설정되어 있습니다' };
  if (t1 && t2 && t2 <= t1)
    return { times: [], error: '2회차는 1회차보다 늦어야 합니다' };
  if (t1 && t2 && toMinutes(t2) < toMinutes(t1) + runningTime)
    return {
      times: [],
      error: `2회차는 1회차 종료(${toTimeText(toMinutes(t1) + runningTime)}) 이후여야 합니다`,
    };
  return { times: [t1, t2].filter(Boolean), error: null };
}

// 이미 등록된 회차와 겹치는지 확인. 시작 시각이 같으면 중복 처리 대상이라 오류가 아님
function findOverlap(
  times: string[],
  registered: string[],
  runningTime: number,
): string | null {
  for (const t of times) {
    for (const r of registered) {
      if (t === r) continue;
      if (Math.abs(toMinutes(t) - toMinutes(r)) < runningTime) {
        return `${t} 회차가 이미 등록된 ${r} 회차와 겹칩니다`;
      }
    }
  }
  return null;
}

// 하루치 검증: 회차끼리 + 등록된 회차와
function checkDay(
  t1: string,
  t2: string,
  registered: string[],
  runningTime: number,
): { times: string[]; error: string | null } {
  const result = checkTimes(t1, t2, runningTime);
  if (result.error) return result;
  return {
    times: result.times,
    error: findOverlap(result.times, registered, runningTime),
  };
}

// JS getDay()는 일=0 → 월=0 기준으로 변환
const toMonFirst = (d: Date) => (d.getDay() + 6) % 7;

// 'yyyy-MM-dd' → 'MM/dd'
const toMonthDay = (key: string) => key.slice(5).replace('-', '/');

function TimeSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  return (
    <Select
      value={value || NONE}
      onValueChange={(v) => onChange(!v || v === NONE ? '' : v)}
    >
      <SelectTrigger id={id} className="w-full min-w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={NONE}>{NONE}</SelectItem>
          {TIME_OPTIONS.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

// ---------- 메인 ----------
export default function ScheduleForm({ stage }: { stage: ScheduleResponse }) {
  const router = useRouter();

  // API의 날짜는 "2030-10-15T00:00:00.000Z" 형태 → 앞 10자리만 사용(시간대 밀림 방지)
  const stageStartKey = stage.startDate.slice(0, 10);
  const stageEndKey = stage.endDate.slice(0, 10);
  const stageStart = useMemo(() => parseISO(stageStartKey), [stageStartKey]);
  const stageEnd = useMemo(() => parseISO(stageEndKey), [stageEndKey]);

  // 기본 일정: 요일별 [1회차, 2회차], 둘 다 없으면 null
  const [basic, setBasic] = useState<BaseSchedule>(INITIAL_BASIC);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);

  // 예외 일정 입력 폼
  const [formOpen, setFormOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [kind, setKind] = useState<ExceptionKind>('CLOSED');
  const [exTimes, setExTimes] = useState<DayTimes>(EMPTY_TIMES);
  const [label, setLabel] = useState('');
  const [formError, setFormError] = useState('');

  // 미리보기
  const months = useMemo(
    () => eachMonthOfInterval({ start: stageStart, end: stageEnd }),
    [stageStart, stageEnd],
  );
  const [monthIdx, setMonthIdx] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setBasicTime(weekday: Weekday, slot: 0 | 1, value: string) {
    setBasic((prev) => {
      const [t1, t2] = prev[weekday] ?? EMPTY_TIMES;
      const next: DayTimes = slot === 0 ? [value, t2] : [t1, value];
      const isEmpty = next[0] === '' && next[1] === '';
      return { ...prev, [weekday]: isEmpty ? null : next };
    });
  }

  function openFormFor(date?: Date) {
    setRange(date ? { from: date, to: date } : undefined);
    setKind('CLOSED');
    setExTimes(EMPTY_TIMES);
    setLabel('');
    setFormError('');
    setFormOpen(true);
  }

  function addException() {
    setFormError('');
    if (!range?.from) {
      setFormError('날짜(또는 기간)를 선택해 주세요.');
      return;
    }

    
    const startDate = format(range.from, 'yyyy-MM-dd');
    const endDate = format(range.to ?? range.from, 'yyyy-MM-dd');

    if (startDate < stageStartKey || endDate > stageEndKey) {
      setFormError('공연 기간 안의 날짜만 선택할 수 있습니다.');
      return;
    }

    let times: DayTimes | null = null;
    if (kind === 'CUSTOM') {
      const { times: valid, error } = checkTimes(exTimes[0], exTimes[1], stage.runningTime);
      if (error) return setFormError(error);
      if (valid.length === 0)
        return setFormError('공연 시간을 1개 이상 선택해 주세요.');
      times = exTimes;
    }

    setExceptions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        startDate,
        endDate,
        kind,
        times,
        label: label.trim(),
      },
    ]);
    setFormOpen(false);
  }

  // 이미 등록된 회차(API 응답)를 날짜별로 묶기. 시간은 브라우저 시간대(KST) 기준
  const registeredMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of stage.schedules) {
      const start = parseISO(s.startAt);
      const key = format(start, 'yyyy-MM-dd');
      map.set(key, [...(map.get(key) ?? []), format(start, 'HH:mm')]);
    }
    for (const times of map.values()) times.sort();
    return map;
  }, [stage.schedules]);

  // 날짜별 최종 일정 계산 (예외가 여러 개 겹치면 나중에 추가한 것이 우선)
  const dayMap = useMemo(() => {
    const map = new Map<string, DayInfo>();
    const days = eachDayOfInterval({ start: stageStart, end: stageEnd });

    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd');
      const registered = registeredMap.get(key) ?? [];
      const ex = [...exceptions]
        .reverse()
        .find((e) => key >= e.startDate && key <= e.endDate);

      if (ex) {
        if (ex.kind === 'CLOSED') {
          map.set(key, {
            kind: 'off',
            fromException: true,
            times: [],
            registered,
            label: ex.label,
          });
        } else {
          const [t1, t2] = ex.times ?? EMPTY_TIMES;
          const { times, error } = checkDay(t1, t2, registered, stage.runningTime);
          map.set(key, {
            kind: error ? 'error' : 'show',
            fromException: true,
            times,
            registered,
            label: ex.label,
            message: error ?? undefined,
          });
        }
        continue;
      }

      const [t1, t2] = basic[WEEKDAYS[toMonFirst(day)]] ?? EMPTY_TIMES;
      const { times, error } = checkDay(t1, t2, registered, stage.runningTime);
      map.set(key, {
        kind: error ? 'error' : times.length === 0 ? 'none' : 'show',
        fromException: false,
        times,
        registered,
        message: error ?? undefined,
      });
    }
    return map;
  }, [basic, exceptions, registeredMap, stage.runningTime, stageStart, stageEnd]);

  // 서버로 보낼 새 회차. dayMap(예외 우선 규칙 적용 완료)에서 만들고, 이미 등록된 회차는 제외
  const newSchedules = useMemo(() => {
    const existing = new Set(
      stage.schedules.map((s) => new Date(s.startAt).getTime()),
    );
    const result: ScheduleCreateRequest['schedules'] = [];

    for (const [key, info] of dayMap) {
      if (info.kind !== 'show') continue;
      const [y, m, d] = key.split('-').map(Number);

      for (const time of info.times) {
        const [hh, mm] = time.split(':').map(Number);
        const start = new Date(y, m - 1, d, hh, mm); // 브라우저(KST) 시각
        if (existing.has(start.getTime())) continue;

        result.push({
          startAt: start.toISOString(), // UTC로 변환 (19:00 KST → 10:00Z)
          endAt: addMinutes(start, stage.runningTime).toISOString(),
        });
      }
    }
    return result;
  }, [dayMap, stage.schedules, stage.runningTime]);

  async function handleConfirm() {
    if (submitting || newSchedules.length === 0) return;
    setSubmitting(true);
    try {
      const body: ScheduleCreateRequest = { schedules: newSchedules };
      await apiFetch<ScheduleResponse>({
        path: `/schedule/${stage.stageId}`,
        method: 'POST',
        body,
      });
      toast.success(`${newSchedules.length}개 회차를 등록했습니다.`);
      setBasic(INITIAL_BASIC);
      setExceptions([]);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '일정 등록에 실패했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const summary = useMemo(() => {
    const all = [...dayMap.values()];
    return {
      totalDays: all.length,
      showDays: all.filter((d) => d.kind === 'show').length,
      totalShows: all.reduce((sum, d) => sum + d.times.length, 0),
      errors: all.filter((d) => d.kind === 'error').length,
    };
  }, [dayMap]);

  const currentMonth = months[monthIdx];
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });
  const selected = selectedKey ? dayMap.get(selectedKey) : undefined;

  return (
    <>
      <PageHeader title="공연 스케줄 등록" />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8">
        {/* 1. 공연 기본 정보 */}
        <section className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">{stage.title}</h2>
          <p className="text-sm text-muted-foreground">
            공연일자 : {format(stageStart, 'yyyy.MM.dd')} ~{' '}
            {format(stageEnd, 'yyyy.MM.dd')}
          </p>
          <p className="text-sm text-muted-foreground">
            러닝타임 : {stage.runningTime}분
          </p>
        </section>

        {/* 2. 기본 일정 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">기본 일정</h2>
          <p className="text-sm text-muted-foreground">
            요일별로 최대 2회차까지 설정할 수 있습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed border-collapse text-center text-sm">
              <thead>
                <tr>
                  <th className="w-16 border bg-muted p-2">요일</th>
                  {WEEKDAYS.map((w) => (
                    <th key={w} className="border bg-muted p-2">
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([0, 1] as const).map((slot) => (
                  <tr key={slot}>
                    <th className="border bg-muted p-2">{slot + 1}회차</th>
                    {WEEKDAYS.map((w) => (
                      <td key={w} className="border p-1">
                        <TimeSelect
                          value={basic[w]?.[slot] ?? ''}
                          onChange={(v) => setBasicTime(w, slot, v)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. 예외 일정 */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">예외 일정</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() => openFormFor()}
            >
              예외 일정 추가 +
            </Button>
          </div>

          {formOpen && (
            <div className="flex flex-col gap-4 rounded-md border p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">날짜 / 기간</label>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="w-[240px] justify-between font-normal"
                        >
                          {range?.from
                            ? `${format(range.from, 'yyyy.MM.dd')}${
                                range.to &&
                                range.to.getTime() !== range.from.getTime()
                                  ? ` ~ ${format(range.to, 'MM.dd')}`
                                  : ''
                              }`
                            : '날짜 선택'}
                          <ChevronDownIcon data-icon="inline-end" />
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={range}
                        onSelect={setRange}
                        defaultMonth={range?.from ?? stageStart}
                        disabled={{ before: stageStart, after: stageEnd }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">유형</label>
                  <Select
                    value={kind}
                    onValueChange={(v) => {
                      if (v === 'CLOSED' || v === 'CUSTOM') setKind(v);
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="CLOSED">공연 없음(휴관)</SelectItem>
                        <SelectItem value="CUSTOM">별도 시간</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {kind === 'CUSTOM' && (
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">1회차</label>
                      <TimeSelect
                        value={exTimes[0]}
                        onChange={(v) => setExTimes([v, exTimes[1]])}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">2회차</label>
                      <TimeSelect
                        value={exTimes[1]}
                        onChange={(v) => setExTimes([exTimes[0], v])}
                      />
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                >
                  닫기
                </Button>
                <Button type="button" onClick={addException}>
                  추가
                </Button>
              </div>
            </div>
          )}

          {exceptions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              등록된 예외 일정이 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {exceptions.map((e) => {
                const dateText =
                  e.startDate === e.endDate
                    ? toMonthDay(e.startDate)
                    : `${toMonthDay(e.startDate)} ~ ${toMonthDay(e.endDate)}`;
                const timeText =
                  e.kind === 'CLOSED'
                    ? '공연없음'
                    : (e.times ?? []).filter(Boolean).join(' / ');
                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                  >
                    <span>
                      [{dateText}] <span className="mx-2">{timeText}</span>
                      {e.label}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="예외 일정 삭제"
                      onClick={() =>
                        setExceptions((prev) =>
                          prev.filter((x) => x.id !== e.id),
                        )
                      }
                    >
                      <MinusIcon />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Separator />

        {/* 4. 전체 일정 미리보기 */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">전체 일정 미리보기</h2>

          {/* 월 탭 */}
          <div className="flex flex-wrap gap-2">
            {months.map((m, i) => (
              <Button
                key={m.toISOString()}
                type="button"
                variant={i === monthIdx ? 'default' : 'outline'}
                onClick={() => setMonthIdx(i)}
              >
                {format(m, 'yyyy.MM')}
              </Button>
            ))}
          </div>

          {/* 범례 */}
          <div className="flex flex-wrap gap-3 text-xs">
            {(
              [
                ['show', '기본 일정'],
                ['exception', '예외 일정'],
                ['off', '공연 없음'],
                ['error', '오류'],
                ['registered', '등록된 회차'],
              ] as const
            ).map(([k, text]) => (
              <span key={k} className="flex items-center gap-1">
                <span
                  className={`inline-block size-3 rounded border ${KIND_STYLE[k]}`}
                />
                {text}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            {/* 달력 */}
            <div className="flex-1 overflow-x-auto">
              <div className="grid min-w-[560px] grid-cols-7 border-l border-t text-xs">
                {CAL_HEADERS.map((h, i) => (
                  <div
                    key={h}
                    className={`border-b border-r bg-muted p-2 text-center font-medium ${
                      i === 0 ? 'text-destructive' : ''
                    }`}
                  >
                    {h}
                  </div>
                ))}
                {calendarDays.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const inMonth = day.getMonth() === currentMonth.getMonth();
                  const info = dayMap.get(key); // 공연 기간 밖이면 undefined

                  if (!inMonth) {
                    return (
                      <div
                        key={key}
                        className="min-h-20 border-b border-r bg-muted/30"
                      />
                    );
                  }
                  if (!info) {
                    return (
                      <div
                        key={key}
                        className="min-h-20 border-b border-r bg-muted/50 p-1 text-muted-foreground"
                      >
                        {day.getDate()}
                      </div>
                    );
                  }
                  const style =
                    info.kind === 'show' && info.fromException
                      ? KIND_STYLE.exception
                      : info.kind === 'none' && info.registered.length > 0
                        ? KIND_STYLE.registered
                        : KIND_STYLE[info.kind];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedKey(key)}
                      className={`min-h-20 border-b border-r p-1 text-left align-top transition-colors hover:ring-2 hover:ring-ring ${style} ${
                        selectedKey === key ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="font-medium">{day.getDate()}</div>
                      {info.kind === 'off' && <div>공연없음</div>}
                      {info.kind === 'error' && <div>오류</div>}
                      {info.times.map((t, i) => (
                        <div key={t}>
                          {i + 1}회 {t}
                        </div>
                      ))}
                      {info.registered.map((t, i) => (
                        <div
                          key={`registered-${t}`}
                          className="text-sky-700 dark:text-sky-300"
                        >
                          등록 {i + 1}회 {t}
                        </div>
                      ))}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 날짜 상세 */}
            <div className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-md border p-6 lg:w-72">
              {selectedKey && selected ? (
                <>
                  <p className="text-lg font-semibold">
                    {selectedKey.replaceAll('-', '.')}
                  </p>
                  <div className="flex flex-col items-center gap-1 text-sm">
                    {selected.kind === 'off' && <p>공연 없음</p>}
                    {selected.kind === 'none' &&
                      selected.registered.length === 0 && (
                        <p className="text-muted-foreground">
                          설정된 회차 없음
                        </p>
                      )}
                    {selected.kind === 'error' && (
                      <p className="text-destructive">{selected.message}</p>
                    )}
                    {selected.times.map((t, i) => (
                      <p key={t}>
                        {i + 1}회 : {t}
                      </p>
                    ))}
                    {selected.registered.length > 0 && (
                      <div className="mt-2 flex flex-col items-center gap-1">
                        <p className="text-xs text-muted-foreground">
                          등록된 회차
                        </p>
                        {selected.registered.map((t, i) => (
                          <p key={`registered-${t}`}>
                            {i + 1}회 : {t}
                          </p>
                        ))}
                      </div>
                    )}
                    {selected.label && (
                      <p className="text-muted-foreground">{selected.label}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {selected.fromException
                        ? '예외 일정 적용'
                        : '기본 일정 적용'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  날짜를 선택하면 상세 일정이 표시됩니다.
                </p>
              )}
            </div>
          </div>

          {/* 요약 */}
          <p className="text-center text-sm font-medium">
            총 {summary.totalDays}일 | 공연일 {summary.showDays}일 | 총{' '}
            {summary.totalShows}회 | 예외 {exceptions.length}건 | 오류{' '}
            {summary.errors}건
          </p>

          <div className="flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-40"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button
              type="button"
              className="w-40"
              disabled={
                summary.errors > 0 || newSchedules.length === 0 || submitting
              }
              onClick={handleConfirm}
            >
              {submitting ? '등록 중...' : '일정 확정'}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
