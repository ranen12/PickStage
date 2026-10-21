import { BadRequestException } from '@nestjs/common';

export function parseStageDate(value: string): Date {
  const isoDate = value.replace(/\./g, '-');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new BadRequestException(`날짜 형식이 올바르지 않습니다: ${value}`);
  }

  const date = new Date(`${isoDate}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`유효하지 않은 날짜입니다: ${value}`);
  }

  return date;
}
