import { StageCategory, ViewingGrade } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class PageRequestDto {
  @IsOptional()
  @IsIn(['latest', 'name'])
  sort?: 'latest' | 'name';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsIn(['registered', 'missing'])
  scheduleStatus?: 'registered' | 'missing';

  @IsOptional()
  @IsEnum(ViewingGrade)
  rating?: ViewingGrade;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;

    const values = Array.isArray(value) ? value : [value];

    return values.flatMap((item) =>
      String(item)
        .split(`,`)
        .map((category) => category.trim()),
    );
  })
  @IsArray()
  @IsEnum(StageCategory, { each: true })
  category?: StageCategory[];
}
