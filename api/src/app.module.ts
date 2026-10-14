import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ScheduleSeatsModule } from './schedule-seats/schedule-seats.module';
import { GuestController } from './guest/guest.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CloudinaryModule,
    ScheduleSeatsModule,
  ],
  controllers: [AppController, GuestController],
  providers: [AppService],
})
export class AppModule {}
