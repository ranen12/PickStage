import { StageCategory, ViewingGrade } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateStageDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsEnum(StageCategory)
  category!: StageCategory;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  runningTime!: number;

  @IsEnum(ViewingGrade)
  rating!: ViewingGrade;

  @IsOptional()
  @IsString()
  description?: string;
}
