'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';

const previewSchedules: Record<string, string[]> = {
  '2026-06-15': ['14:00', '19:00'],
  '2026-06-16': ['19:00'],
  '2026-06-17': ['19:00'],
  '2026-06-18': ['19:00'],
  '2026-06-19': ['19:00'],
  '2026-06-20': ['14:00', '18:00'],
};


const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatKoreanDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
}

export default function NewStageSchedulesPage() {

  const [month, setMonth] = useState(new Date(2026, 5, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 5, 15));

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cellCount = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const selectedTimes = previewSchedules[toDateKey(selectedDate)] ?? [];

  const changeMonth = (offset: number) => {
    setMonth(new Date(year, monthIndex + offset, 1));
  };


  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      <section className="w-full mx-auto">
        <div className="bg-gray-100 py-4 px-6 rounded-lg mb-6">
          <div className="pb-2">
            <h2 className="text-2xl font-bold">
              <span className="">[연극]</span> 연극 라면
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            2026.06.15~2026.06.20 | PickStage HALL
          </p>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">기본 일정</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/8 text-center">요일</TableHead>
                <TableHead className="w-1/8 text-center">월</TableHead>
                <TableHead className="w-1/8 text-center">화</TableHead>
                <TableHead className="w-1/8 text-center">수</TableHead>
                <TableHead className="w-1/8 text-center">목</TableHead>
                <TableHead className="w-1/8 text-center">금</TableHead>
                <TableHead className="w-1/8 text-center">토</TableHead>
                <TableHead className="w-1/8 text-center">일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center">회차</TableCell>
                <TableCell className="text-center">
                  <Input type="time" placeholder="회차" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <h3 className="text-lg font-semibold">예외 일정</h3>
          <Button type="button" variant="outline" size="sm">
            예외 일정 추가
          </Button>
        </div>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Input type="date" placeholder="날짜" />
            <Input type="time" placeholder="시간" />
            <Button type="button" variant="outline" size="lg">
              공연 없음
            </Button>
            <Button type="button" variant="destructive" size="sm">
              삭제
            </Button>
          </li>
        </ul>
      </section>
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">전체 일정 미리보기</h3>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
 <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => changeMonth(-1)}
              aria-label="이전 달"
            >
              ‹
            </Button>
            <p className="font-semibold">
              {year}년 {monthIndex + 1}월
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => changeMonth(1)}
              aria-label="다음 달"
            >
              ›
            </Button>
          </div>

          <div className="grid grid-cols-7">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`border-b px-1 py-2 text-center text-xs font-medium ${
                  index === 0 ? 'text-red-500' : 'text-muted-foreground'
                }`}
              >
                {day}
              </div>
            ))}

            {Array.from({ length: cellCount }, (_, index) => {
              const dayNumber = index - firstDay + 1;
              const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
              const date = isCurrentMonth
                ? new Date(year, monthIndex, dayNumber)
                : null;
              const times = date ? previewSchedules[toDateKey(date)] ?? [] : [];
              const isSelected =
                date !== null && toDateKey(date) === toDateKey(selectedDate);

              return (
                <button
                  key={index}
                  type="button"
                  disabled={!date}
                  onClick={() => date && setSelectedDate(date)}
                  className={`min-h-24 border-b border-r p-1.5 text-left align-top transition-colors sm:min-h-28 ${
                    isSelected ? 'bg-primary/5 ring-1 ring-inset ring-primary' : ''
                  } ${date ? 'hover:bg-muted/50' : 'bg-muted/20'}`}
                >
                  {date && (
                    <>
                      <span
                        className={`flex size-6 items-center justify-center rounded-full text-xs ${
                          index % 7 === 0 ? 'text-red-500' : ''
                        } ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
                      >
                        {dayNumber}
                      </span>

                      <div className="mt-1 space-y-0.5">
                        {times.map((time, timeIndex) => (
                          <p
                            key={`${time}-${timeIndex}`}
                            className="truncate text-[10px] leading-4 text-primary sm:text-xs"
                          >
                            [{timeIndex + 1}회] {time}
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

          <aside className="flex min-h-64 flex-col rounded-lg border p-5">
            <p className="text-sm text-muted-foreground">선택한 날짜</p>
            <h4 className="mt-1 text-lg font-semibold">
              {formatKoreanDate(selectedDate)}
            </h4>

            <div className="my-4 border-t" />

            {selectedTimes.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">공연 회차</p>
                <ul className="space-y-2">
                  {selectedTimes.map((time, index) => (
                    <li
                      key={`${time}-${index}`}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                    >
                      <span>{index + 1}회차</span>
                      <span className="font-medium">{time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                선택한 날짜에는 공연 일정이 없습니다.
              </div>
            )}
          </aside>
        </div>
      </section>
      <div className="flex gap-4 justify-center">
        <Button type="button" variant="outline" className="flex-1 max-w-xs">
          취소
        </Button>
        <Button type="submit" className="flex-1 max-w-xs">
          회차 등록
        </Button>
      </div>
    </div>
  );
}
