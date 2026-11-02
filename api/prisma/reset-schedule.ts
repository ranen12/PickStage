//회차를 초기화하는 임시 파일입니다. 해당 파일에 SCHEDULE_ID를 직접 수정하여 npx tsx prisma/reset-schedule.ts 
//하면 실행됩니다.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCHEDULE_ID = 1; // 초기화할 회차

async function main() {
  const { count } = await prisma.scheduleSeat.updateMany({
    where: { scheduleId: SCHEDULE_ID },
    data: {
      seatStatus: 'AVAILABLE',
      holderId: null,
      holdExpiresAt: null,
      reservationId: null,
    },
  });
  console.log(`회차 ${SCHEDULE_ID}번의 좌석 ${count}개를 초기화했습니다.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());