import { Module } from '@nestjs/common';
import { ScheduleSeatsService } from './schedule-seats.service';
import { ScheduleSeatsController } from './schedule-seats.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[PrismaModule],//DB접근기능
  providers: [ScheduleSeatsService],
  controllers: [ScheduleSeatsController]
})
export class ScheduleSeatsModule {}
