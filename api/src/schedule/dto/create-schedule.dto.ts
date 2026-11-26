import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsISO8601,
  Matches,
  ValidateNested,
} from 'class-validator';

export class ScheduleItemDto {
  // strict: 존재하지 않는 날짜(2월 30일 등) 거부 / Z로 끝나는 UTC만 허용
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/Z$/, { message: 'startAt은 UTC(Z) 시각이어야 합니다.' })
  startAt!: string;

  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/Z$/, { message: 'endAt은 UTC(Z) 시각이어야 합니다.' })
  endAt!: string;
}

export class CreateScheduleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000) // 한 번에 보낼 수 있는 최대 회차 수 (학습용 상한)
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  schedules!: ScheduleItemDto[];
}
