import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const seats = 'ABCDEFGH'.split('').flatMap((rowName) =>
    Array.from({ length: 25 }, (_, index) => {
      const seatNumber = index + 1;

      return {
        venue_name: 'PickStage Hall',
        seatCode: `${rowName}${seatNumber}`,
        grade: 'S',
        seatNumber,
        rowName,
      };
    }),
  );

  const { count } = await prisma.seat.createMany({
    data: seats,
    skipDuplicates: true,
  });
  console.log(`${count}개의 좌석을 생성했습니다.`);
}

main()
  .catch((error) => {
    console.error('좌석 시드 생성 중 오류가 발생했습니다:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
