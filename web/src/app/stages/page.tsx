import Link from 'next/link';
import Image from 'next/image';

import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function Stages() {
  return (
    <div className="flex flex-col gap-4 px-4 py-8">
      <div className="flex gap-2 justify-between items-center ">
        <p>
          공연은 총 <strong>5</strong>개 있습니다.
        </p>
        <Select defaultValue="latest">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">최신 등록순</SelectItem>
            <SelectItem value="name">이름순</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <ToggleGroup variant="outline" multiple>
          <ToggleGroupItem value="musical" aria-label="뮤지컬">
            뮤지컬
          </ToggleGroupItem>
          <ToggleGroupItem value="play" aria-label="연극">
            연극
          </ToggleGroupItem>
          <ToggleGroupItem value="classic" aria-label="클래식">
            클래식
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <Separator />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Link href="/stages/1">
          <Card className="overflow-hidden trasition-colors hover:bg-gray-50">
            <Image
              src="https://tkfile.yes24.com/upload2/perfblog/202608/20260825/20260825-49515.jpg/dims/quality/70/"
              alt="공연 1"
              width={400}
              height={200}
              className="w-full h-full object-cover"
            />
            <CardContent className="min-w-0 px-4">
              <h3 className="truncate text-lg font-semibold">
                공연 1
              </h3>
              <p className="text-sm text-muted-foreground">
                2023.01.01 ~ 2023.01.31
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
