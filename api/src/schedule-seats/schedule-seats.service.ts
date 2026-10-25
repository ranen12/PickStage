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

    //이 회차에서 시간이 만료된 HOLD를 해제합니다.
    await this.prisma.scheduleSeat.updateMany({
      where:{
        scheduleId, //현재 조회하는 회차에서
        seatStatus:'HOLD',
        holdExpiresAt:{lte: new Date()},//만료시각이 new Date() 보다 이전시점이거나 같은경우
      },
        data:{ //data를 이렇게 수정하겠음
          seatStatus:'AVAILABLE',
          holderId:null,
          holdExpiresAt:null,
        },
      })

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
          const holdExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); //5분뒤시간을 다시 시간객체로 만듬

          if (schedule.startAt <= now) { //공연시각이 현재 시간보다 작거나 같다면,
            throw new BadRequestException('이미 시작된 공연입니다.');
          }

          //내가 이미 선점한 좌석이 있나 확인
          const existingHold = await tx.scheduleSeat.findFirst({
            where: {
              scheduleId,
              holderId: guestId,
              seatStatus: 'HOLD',
              holdExpiresAt: { gt: now },//gt는 greater than > 만료시각이 지금보다 미래여야 유효선점
            },
            select: { id: true },
          });

          if (existingHold) {
            throw new ConflictException(
              '이미 선점한 좌석이 있습니다. 예약을 계속하거나 선점을 해제해 주세요.', //이미 선점된 좌석이 있다면 거절, 2개만 예약상태여도 거절해야함.
              //취소하고 다시 선점(4개까지)는 가능하나 2개 하고 + 2개 더 추가로 하는형태는 거절하도록 했음.
            );
          }

          //위에서 선점중인 사람이 아닌게 확인되었으니
          //원하는 좌석을 HOLD 로 선점함
          const result = await tx.scheduleSeat.updateMany({
            where: {
              id: { in: scheduleSeatIds },//ID가 해당 scheduleIds인 좌석
              scheduleId,//같은회차
              reservationId: null,//확정된 예약과 연결되어 있지 않아야함.
              OR: [ //아래중 하나라도 만족하면 된다.
                { seatStatus: 'AVAILABLE' }, //비어있는 좌석이거나, 
                {
                  seatStatus: 'HOLD', //HOLD 이지만
                  holdExpiresAt: { lte: now }, //만료시간이 지난 좌석은 선점 가능하도록 만들어야 한다.
                },
              ],
            },
            data: {
              seatStatus: 'HOLD', //상태 HOLD
              holderId: guestId, // 선점자 
              holdExpiresAt, //만료시각을 계산해서 언제까지 HOLD 한건지 표기함, 해당것을 기준으로 만료된것은 선점가능하도록 변경
            },
          });

          //하나라도 변경하지 못했다면 변경롤백
          if (result.count !== scheduleSeatIds.length) { //result.count 변경한 좌석수, scheduleSeatIds.length 요청한 좌석수
            throw new ConflictException( //throw 가 실행되면 변경했던것도 롤백된다.
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
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable, //동시에 실행된 트랜잭션 결과를 하나씩 처리한듯이 함
        }, //만약 내 기존 선점이 있는지 조회> 없다면 새 좌석 선점이라는 규칙이 존재하는데
        //해당 코드가 없다면 같은 방문자가 서로 다른 좌석으로 요청을 두 번 보낼시 두 요청모두 기존 선점 없음을 볼수있다.
      );
    } catch (error) {
      //P2034 은 동시쓰기 충돌, 교착, 트랜잭션 실패 코드
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

      throw error; //p2034 오류가 아니라면 다시 던진다.
    }
  }
}

//선점한 좌석 전체 취소하기(취소버튼으로 동작)
async releaseHolds(scheduleId: number, guestId: string) {}
}
/*SQL 회차 선점예시
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



/*
SQL 작성예시 만료한 HOLD를 가능상태로 변경하는 코드
39번쯤 라인 
UPDATE "ScheduleSeat"
SET 
  "seatStatus" = 'AVAILABLE',
  "holderId" = NULL,
  "holdExpiresAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "scheduleId" = 1
  AND "seatStatus" = 'HOLD'
  AND "holdExpiresAt" <= CURRENT_TIMESTAMP;

  >>SET은 변경할값, WHERE은 변경할 대상의 조건, <CURRENT_TIMESTAMP 현재 이전시점, NULL값이 없는 상태
  >>읽는 순서는, 어떤 좌석을 찾아서, 무엇으로 변경하는가
*/