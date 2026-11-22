import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { logger } from 'src/config/logger';
import { Prisma } from '@prisma/client';

@Injectable()
export class ScheduleSeatsService {
    //Nest가 PrismaService를 넣어주고 this.prisma로 사용
    constructor(private readonly prisma: PrismaService) {}


    //이 회차에서 시간이 만료된 HOLD를 해제하는 updateMany 가 있었으나, 성능문제로 삭제하였음
   
    async findByschedule(scheduleId: number, guestId?: string){
      logger.info(`findByschedule scheduleId: ${scheduleId}, guestId: ${guestId}`);

      //scheduleId 는 함수의 매개변수로 전달받은 회차Id
      //해당 공연회차에 정보를 가져와 schedule 넣음
      const schedule = await this.prisma.stageSchedule.findUnique({
        where: {id: scheduleId}, //회차
        select: {
          id: true,
          startAt: true,
          endAt: true,
          stage: {
            select:{
              id:true,
              title: true,
              category:true,
              price:true,
            }
          }
        }
      });
      if(!schedule) {
        logger.error(`findByschedule scheduleId: ${scheduleId} not found`);
        throw new NotFoundException(`공연 회차를 찾을 수 없습니다.`)
      }
      //만료 여부를 판단할 기준 현재 시각.
      const now = new Date();

      //해당 회차id를 가지고 ScheduleSeat 테이블에서 좌석 정보를 가져온다(읽기만)
      const rows = await this.prisma.scheduleSeat.findMany({
        where:{scheduleId},
        select:{
          id:true, //ScheduleSeat의 id,
          seatStatus: true,
          holderId:true, //내 좌석인지 판단한다(응답에는 내보내면 x)
          holdExpiresAt:true, //만료 여부 판단용
          seat:{ //join
            select:{
              seatCode:true,
              rowName:true,
              seatNumber:true,
              grade:true,
            }
          }
        },
        orderBy:[
          {seat:{rowName: 'asc'}},
          {seat:{seatNumber:'asc'}}
        ],
      });

      //LAZY 방식: DB값은 그대로 두고, 응답을 만들 때만 만료를 해석
      //map 을 사용하여 가져온 좌석을 돌면서 응답용 모양으로 만듬. map 은 목록의 항목을 변환하여 새 항목을 만든다
      const seats = rows.map((row)=>{
        //유효한 HOLD = HOLD 상태이면서 만료 시각이 아직 미래인경우만 판단, 만료시간이 있다고 전부 HOLD로 판단하지말것
        const isActiveHold = 
          row.seatStatus ==='HOLD' && //HOLD 상태인지 확인
          row.holdExpiresAt !== null && //만료시각이 적혀있는 상태
          row.holdExpiresAt > now; //HOLD 상태이면서 만료시각이 아직 미래

          //HOLD 인데 만료되었다면 빈 좌석으로 보여준다(DB엔 HOLD 상태이나 시간을 보고 판단)
          const status = row.seatStatus === "HOLD" && isActiveHold ? 'AVAILABLE' : row.seatStatus;

          //내가 잡은 좌석인가 확인
          const isMine =
            isActiveHold && guestId !== undefined && row.holderId === guestId;

            return {
              id: row.id,
              seatStatus: status,
              isMine,
              holdExpiresAt: isMine ? row.holdExpiresAt: null, //내 좌석만 알려줌
              seat: row.seat,
              //holderId 는 일부러 내보내지 않음.

            }
      })//map 종료지점
      return {
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
//guestId는 방문자 식별ID (방문자 쿠키 발급 API에서 만들었음)
//guest.controller
//guestId 는 DB에 holderId 부분에 저장된다
async releaseHolds(scheduleId: number, guestId: string) {

  if (scheduleId <1 ){ //양수가 아닌 회차 id가 잘못들어오는것을 방지
    throw new BadRequestException('올바른 회차 ID가 필요합니다.');
  }

  const result = await this.prisma.scheduleSeat.updateMany({
    where: {
      scheduleId,
      holderId: guestId, //다른사람의 id를 해제하지않는다.
      seatStatus:'HOLD',
    },
    data: {
      seatStatus: 'AVAILABLE',
      holderId: null, 
      holdExpiresAt:null,
    }
  });
  return {
    message: '선점 해제 완료.',
    releasedCount : result.count, //releasedCount는 내가 지은이름
    //result.count는 result가 몇개인지 알려서 선점해제한 좌석이 몇개인지 안내
  }
}


/**
 * 예매확정
 * 내가 HOLD 한 좌석중 만료되지 않은 좌석만 SOLD 로 바꾸고 예약만들기
 */

async confirmReservation(scheduleId: number, scheduleSeatIds: number[], customerName: string, customerPhone: string, guestId : string){
  if(scheduleId < 1){
    throw new BadRequestException('올바른 회차 ID가 필요합니다.');
  }

  //하이픈 없애서 저장형식 통일
  const phone = customerPhone.replace(/-/g, '');

  return this.prisma.$transaction(async (tx) => {
    //회차 확인 + 가격 가져오기
    const schedule =await tx.stageSchedule.findUnique({
      where:{ id: scheduleId},
      select: {
        id : true,
        startAt: true,
        stage: { select : { price: true }},
      },
  });

  if(!schedule){
    throw new NotFoundException('공연 회차를 찾을 수 없습니다.');
  }

  const now = new Date(); //현재 시간
  if(schedule.startAt <= now){
    throw new BadRequestException('이미 시작된 공연입니다.');
  }

  //예약 먼저 만들기. (좌석에 reservationId를 넣어야 하므로 예약을 먼저 만들어야한다)
  //총액은 클라이언트에서 보내주나, 서버에서 따로 계산하기
  const reservation = await tx.reservation.create({
    data: {
      scheduleId,
      customerName,
      customerPhone: phone,
      totalAmount: schedule.stage.price * scheduleSeatIds.length, //총액계산
    },
    select: {id:true, reservationNo: true, totalAmount: true},
  });

  // 조건부 UPDATE: 아래 조건을 모두 만족하는 좌석만 SOLD 로 변경
  const result = await tx.scheduleSeat.updateMany({
    where: {
      id: { in: scheduleSeatIds}, //요청한 좌석중에서
      scheduleId, //같은회차이고
      seatStatus: 'HOLD', //HOLD 상태이면서
      holderId: guestId, //내가 잡은 좌석이고(소유권자)
      holdExpiresAt: { gt: now}, //만료되지 않은 상태
      reservation: null, //다른 예약에 연결되지 않은 좌석
    },
    data: {
      seatStatus: 'SOLD', //좌석 상태 변경
      reservationId: reservation.id,
      holderId: null, //선점자 해제
      holdExpiresAt: null //만료시간 해제
    }
  });
  //holdSeats는 조회>판단>변경 두단계로 이루어져 같은 사람이 요청 두개를 보내면 문제가 생길수 있어
  //Serialializable 로 동시요청을 막았음. ConfirmReservation은 판단과 변경이 UPDATE안에
  //한번에 WHERE > SET으로 이뤄지니 Serialializable로 막지 않아도 된다.

  //하나라도 바꾸지 못했으면, 전부 롤백한다(만든 예약도 같이 사라진다)
  if(result.count !== scheduleSeatIds.length){
    throw new ConflictException(
      '선점 시간이 만료되었거나 선점하지 않은 좌석이 포함되어 있습니다. 좌석을 다시 선택해주세요'
    )
  }
  
  return {
    message: '예매가 완료되었습니다.',
    reservationNo: reservation.reservationNo, //예약번호
    totalAmount: reservation.totalAmount, //총액
    scheduleSeatIds, //예매된 좌석
  };
});
}

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