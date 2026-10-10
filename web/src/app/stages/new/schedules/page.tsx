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

export default function NewStageSchedulesPage() {
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
          <Button type="button" variant="outline" size="sm">예외 일정 추가</Button>
        </div>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Input type="date" placeholder="날짜" />
            <Input type="time" placeholder="시간" />
            <Button type="button" variant="outline" size="lg">공연 없음</Button>
            <Button type="button" variant="destructive" size="sm">삭제</Button>
          </li>
        </ul>
      </section>
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">전체 일정 미리보기</h3>
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
