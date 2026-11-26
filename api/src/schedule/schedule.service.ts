import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { logger } from 'src/config/logger';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

type Slot = { startAt: Date; endAt: Date };
type StageRange = { startDate: Date; endDate: Date; runningTime: number };

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 스케쥴 생성
   * @param stageId
   * @param dto
   * @returns
   */
  /**
   * 스케쥴 생성
   * @param stageId
   * @param dto
   * @returns
   */
  async create(stageId: number, dto: CreateScheduleDto) {
    logger.info(`ScheduleService create started. stageId: ${stageId}`);

    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      logger.error(`Stage with id ${stageId} not found.`);
      throw new NotFoundException(`Stage with id ${stageId} not found.`);
    }

    const slots: Slot[] = dto.schedules.map((schedule) => ({
      startAt: new Date(schedule.startAt),
      endAt: new Date(schedule.endAt),
    }));

    // 1) 요청 자체 검증 (DB 조회 없음)
    this.validateSlots(stage, slots);

    try {
      await this.prisma.$transaction(
        async (tx) => {
          // 2) 이미 등록된 회차와의 충돌 검사
          const existingSchedules = await tx.stageSchedule.findMany({
            where: { stageId },
            select: {
              startAt: true,
              endAt: true,
            },
          });
          this.checkConflicts(slots, existingSchedules);

          // 3) 회차 생성 (생성된 id를 돌려받는다)
          const createdSchedules = await tx.stageSchedule.createManyAndReturn({
            data: slots.map((slot) => ({
              stageId,
              startAt: slot.startAt,
              endAt: slot.endAt,
            })),
            select: {
              id: true,
            },
          });

          // 4) 방금 만든 회차 × 기본 좌석 전체를 SQL 한 번으로 ScheduleSeat에 생성
          const scheduleIds = createdSchedules.map((s) => s.id);
          const t = Date.now();
          const inserted = await tx.$executeRaw`
            INSERT INTO "ScheduleSeat" ("scheduleId", "seatId", "seatStatus", "updatedAt")
            SELECT s."id", seat."id", 'AVAILABLE'::"SeatStatus", NOW()
            FROM "StageSchedule" s
            CROSS JOIN "Seat" seat
            WHERE s."id" IN (${Prisma.join(scheduleIds)})
          `;
          logger.info(
            `ScheduleSeat inserted: ${inserted} rows, ${Date.now() - t}ms`,
          );

          // 좌석이 하나도 없으면 0행이 들어가므로 에러 처리 (트랜잭션 전체 롤백)
          if (inserted === 0) {
            throw new InternalServerErrorException(
              '기본 좌석(Seat)이 없습니다. seed를 먼저 실행하세요.',
            );
          }
        },
        { timeout: 30_000 },
      );
    } catch (error) {
      // unique(stageId, startAt) 위반 = 동시에 같은 회차가 등록된 경우
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          '동시에 같은 회차가 등록되었습니다. 잠시 후 다시 시도하세요.',
        );
      }
      throw error;
    }

    logger.info(`ScheduleService create ended. stageId: ${stageId}`);
    return this.findOne(stageId);
  }

  /**
   * 공연 스케쥴 조회
   * @param stageId
   * @returns
   */
  async findOne(stageId: number) {
    logger.info(`ScheduleService findOne started. stageId: ${stageId}`);

    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        schedules: {
          orderBy: { startAt: 'asc' },
        },
      },
    });

    if (!stage) {
      logger.error(`Stage with id ${stageId} not found.`);
      throw new NotFoundException(`Stage with id ${stageId} not found.`);
    }

    logger.info(`ScheduleService findOne ended. stageId: ${stageId}`);
    return {
      stageId: stage.id,
      title: stage.title,
      startDate: stage.startDate,
      endDate: stage.endDate,
      runningTime: stage.runningTime,
      schedules: stage.schedules.map((schedule) => ({
        id: schedule.id,
        startAt: schedule.startAt,
        endAt: schedule.endAt,
      })),
    };
  }

  // 요청 안에서만 확인할 수 있는 검증 (400)
  private validateSlots(stage: StageRange, slots: Slot[]) {
    const rangeStart = stage.startDate.getTime();
    // @db.Date는 UTC 자정으로 오므로, 종료일은 하루 전체를 포함시킨다.
    // (프론트가 09:00~22:00 KST만 허용해 UTC로도 같은 날짜라서 가능한 계산)
    const rangeEnd = stage.endDate.getTime() + DAY_MS;
    const seen = new Set<number>();

    for (const slot of slots) {
      const start = slot.startAt.getTime();
      const end = slot.endAt.getTime();

      if (end - start !== stage.runningTime * MINUTE_MS) {
        throw new BadRequestException(
          `종료 시각이 러닝타임(${stage.runningTime}분)과 맞지 않습니다: ${slot.startAt.toISOString()}`,
        );
      }
      if (start < rangeStart || start >= rangeEnd) {
        throw new BadRequestException(
          `공연 기간을 벗어난 회차입니다: ${slot.startAt.toISOString()}`,
        );
      }
      if (seen.has(start)) {
        throw new BadRequestException(
          `중복된 회차가 있습니다: ${slot.startAt.toISOString()}`,
        );
      }
      seen.add(start);
    }

    // 요청 안의 회차끼리 겹치는지 (끝나는 시각에 다음 회차가 시작하는 것은 허용)
    const sorted = [...slots].sort(
      (a, b) => a.startAt.getTime() - b.startAt.getTime(),
    );
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startAt.getTime() < sorted[i - 1].endAt.getTime()) {
        throw new BadRequestException(
          `요청 안에서 회차가 겹칩니다: ${sorted[i].startAt.toISOString()}`,
        );
      }
    }
  }

  // DB에 이미 있는 회차와의 충돌 (409)
  private checkConflicts(slots: Slot[], existing: Slot[]) {
    for (const slot of slots) {
      for (const e of existing) {
        if (slot.startAt.getTime() === e.startAt.getTime()) {
          throw new ConflictException(
            `이미 등록된 회차입니다: ${slot.startAt.toISOString()}`,
          );
        }
        const overlaps =
          slot.startAt.getTime() < e.endAt.getTime() &&
          e.startAt.getTime() < slot.endAt.getTime();
        if (overlaps) {
          throw new ConflictException(
            `이미 등록된 회차와 시간이 겹칩니다: ${slot.startAt.toISOString()}`,
          );
        }
      }
    }
  }
}
