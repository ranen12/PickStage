import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

//ai로 만든 임시 회차별 좌석 seed

const prisma = new PrismaClient();

async function main() {
  // 1. 이미 만들어 둔 기본 좌석을 가져옵니다.
  const seats = await prisma.seat.findMany({
    where: { venueName: 'PickStage Hall' },
  });

  if (seats.length === 0) {
    throw new Error('기본 좌석이 없습니다. 좌석 시드를 먼저 실행해 주세요.');
  }

  // 2. 테스트 공연을 만듭니다.
  const stage = await prisma.stage.create({
    data: {
      title: '테스트 공연',
      category: 'CONCERT',
      startDate: new Date('2030-10-15'),
      endDate: new Date('2030-10-15'),
      price: 30000,
      runningTime: 120,
      rating: 'ALL',
    },
  });

  // 3. 방금 만든 공연에 회차 하나를 만듭니다.
  const schedule = await prisma.stageSchedule.create({
    data: {
      stageId: stage.id,
      startAt: new Date('2030-10-15T19:00:00+09:00'),
      endAt: new Date('2030-10-15T21:00:00+09:00'),
    },
  });

  // 4. 기본 좌석마다 이번 회차의 상태 기록을 만듭니다.
  await prisma.scheduleSeat.createMany({
    data: seats.map((seat) => ({
      scheduleId: schedule.id, // 모두 같은 회차
      seatId: seat.id, // 각각의 기본 좌석
      seatStatus: 'AVAILABLE',
    })),
  });

  console.log('조회에 사용할 회차 ID:', schedule.id);
  console.log('생성한 회차별 좌석 수:', seats.length);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
