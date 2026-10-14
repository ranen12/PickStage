import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { logger } from 'src/config/logger';
import { Prisma } from '@prisma/client';

@Injectable()
export class ScheduleSeatsService {
    //Nest가 PrismaService를 넣어주고 this.prisma로 사용
    constructor(private readonly prisma: PrismaService) {}


    async findByschedule(scheduleId: number){
        logger.info(`findByschedule scheduleId: ${scheduleId}`);

        //scheduleId는 함수의 매개변수로 전달받은 회차ID
        //해당 공연회차에 정보를 가져와 schedule 에 담는다.
        const schedule = await this.prisma.stageSchedule.findUnique({
            where: { id: scheduleId},
            select: {
                id: true,
                startAt:true,
                endAt:true,
                stage:{
                    select:{
                        id:true,
                        title: true,
                        category:true,
                        price:true,
                    }
                }
            }
        });

        if(!schedule){
            logger.error(`findByschedule scheduleId: ${scheduleId} not found`);
            throw new NotFoundException(`공연 회차를 찾을 수 없습니다.`);
    }

    //해당 회차id를 가지고 ScheduleSeat 테이블에서 좌석정보를 가져온다.
    //참고: seat는 좌석그자체, scheduleseat는 회차별 좌석이며, seat(좌석)과 stageChedule(공연회차)를 fk하고 있다.
    //scheduleSeat 테이블엔 여러 회차 좌석 정보가 전부 들어있기에 여기서 scheduleId로 해당 회차에 좌석만 가져와야하는것이다.
    const seats = await this.prisma.scheduleSeat.findMany({
        where:{scheduleId},
        select:{
        id:true, //ScheduleSeat 의 id
        seatStatus:true, 
        seat:{ //연결된 Seat의 정보도 가져온다.seat Seat @relation(fields: [seatId], references: [id], onDelete: Restrict) 연결한것
            select:{ //Seat의 seatCode
                seatCode:true,
                rowName:true,
                seatNumber:true,
                grade:true,
            }
        }
        },
        orderBy:[ //정렬기준
            {seat:{rowName:'asc'}}, //첫번째기준: 행이름을 오름차순 정렬
            {seat:{seatNumber:'asc'}}, //두번재 기준: 좌석넘버 오름차순 정렬
        ],

    });
    return{
        schedule, seats,
    }

}
/* join하기
SELECT
  ss."id",
  s."seatCode",
  ss."seatStatus"
FROM "ScheduleSeat" AS ss
JOIN "Seat" AS s
  ON ss."seatId" = s."id"  -- seatId와 id가 같은 행끼리 연결
WHERE ss."scheduleId" = 10; -- 10번 회차만 조회
*/


/**
 * 좌석 선점하기
 * @param scheduleId //어떤회차인가
 * @param scheduleSeatIds //회차별 좌석에 어떤 좌석들을 선택했는가.
 * @param gusetId //요청자(방문자id)
 * 
 */
async holdSeats(
  scheduleId: number, 
  scheduleSeatIds: number[],
  guestId: string,
) {
  if (scheduleId < 1) {
    throw new BadRequestException('올바른 회차 ID가 필요합니다.');
  }

  //동시 요청으로 DB 충돌이 생기면 최대 3회 시도
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const schedule = await tx.stageSchedule.findUnique({
            where: { id: scheduleId },
            select: { id: true, startAt: true },
          });

          if (!schedule){
            throw new NotFoundException('공연 회차를 찾을 수 없습니다.');
          }

          const now = new Date();
          const holdExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);

          if (schedule.startAt <= now) {
            throw new BadRequestException('이미 시작된 공연입니다.');
          }

          // 같은 방문자가 이 회차에 유효한 선점을 가지고 있는지 확인합니다.
          const existingHold = await tx.scheduleSeat.findFirst({
            where: {
              scheduleId,
              holderId: guestId,
              seatStatus: 'HOLD',
              holdExpiresAt: { gt: now },
            },
            select: { id: true },
          });

          if (existingHold) {
            throw new ConflictException(
              '이미 선점한 좌석이 있습니다. 예약을 계속하거나 선점을 해제해 주세요.',
            );
          }

          //선택한 좌석 중 현재 선점 가능한 좌석만 변경합니다.
          const result = await tx.scheduleSeat.updateMany({
            where: {
              id: { in: scheduleSeatIds },
              scheduleId,
              reservationId: null,
              OR: [
                { seatStatus: 'AVAILABLE' },
                {
                  seatStatus: 'HOLD',
                  holdExpiresAt: { lte: now },
                },
              ],
            },
            data: {
              seatStatus: 'HOLD',
              holderId: guestId,
              holdExpiresAt,
            },
          });

          //하나라도 변경하지 못했다면 변경롤백
          if (result.count !== scheduleSeatIds.length) {
            throw new ConflictException(
              '선점할 수 없는 좌석이 포함되어 있습니다. 좌석을 다시 확인해 주세요.',
            );
          }

          return {
            message: '좌석을 선점했습니다.',
            scheduleId,
            scheduleSeatIds,
            holdExpiresAt,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      //Prisma의 동시 쓰기 충돌/교착 오류만 재시도 P2034 
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        if (attempt < 2) {
          continue;
        }

        throw new ConflictException(
          '동시 요청으로 선점하지 못했습니다. 다시 시도해 주세요.',
        );
      }

      throw error;
    }
  }
}

/*SQL 작성 예시
$1 회차ID
$2 방문자ID
$3 선택한 ScheduleSeat.id 배열
$4 이번 시도에서 계산한 현재 시각
$5 현재 시각에서 5분 뒤

BEGIN TRANSACTION ISOLATION SEVEL SERIALIZABLE;

SELECT "id", "startAt"
FROM "StageSchedule"
WHERE "id" = $1; //서버코드에서 결과가 없거나 이미 시작된 공연일시 rollback 하고 오류 반환

같은 방문자의 유효한 선점 조회, 결과가 있을시 rollback 하고 이선좌 띄움
SELECT "id"
FROM "ScheduleSeat"
WHERE "scheduleId" = $1
    AND "holderId" =$2
    AND "seatStatus" = 'HOLD'
    AND "holdExpiresAt" > $4
LIMIT 1;

선점 가능한 좌석만 변경
UPDATE "ScheduleSeat"
SET
    "seatStatus"= 'HOLD',
    "holderId" = $2,
    "holdExpiresAt" = $5,
    "updatedAt" = $4
WHERE "scheduleId" =$1
    AND "id" =ANY($3::int[]) //전달한 정수 배열에 ID가 포함되는지 확인한다.[101,102]
    AND "reservationId" IS NULL //선택한 좌석이 비어있거나 선점이 만료되었을때만 변경하라
    AND (
    "seatStatus"= 'HOLD'
    ANd "holdExpiresAt" <= $4
        )
    )
        RETURNING "id"; //실제로 변경된 좌석의 ID를 돌려준다.

    서버코드에서 반환된 좌석 수와 요청한 좌석 수를 비교한다.
    변경된 좌석수 !== 요청한 좌석수 라면 ROLLBACK 실행후 선점불가 오류 반환
    아니라면 COMMIT 실행후 성공 응답. 
    모두변경시만 COMMIT 하나라도 변경되지 않을시 ROLLBACk
    
    중요한건  서버코드가 하니 SQL은 참고만하자
*/
}


