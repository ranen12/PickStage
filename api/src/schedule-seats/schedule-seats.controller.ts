import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { ScheduleSeatsService } from './schedule-seats.service';
import { HoldSeatsDto } from './dto/hold-seats.dto';
import type { Request } from 'express';

@Controller('schedules')
export class ScheduleSeatsController {
    constructor(
        private readonly scheduleSeatsService: ScheduleSeatsService){}

        //GET /schedules/10/seats 형태
        @Get(':scheduleId/seats')
        findBySchedule( //parseIntPipe로 scheduleId를 number로 변환, 숫자로 바꿔지지 않을시 400오류 
            @Param('scheduleId', ParseIntPipe) scheduleId: number){
                return this.scheduleSeatsService.findByschedule(scheduleId);
        }

        @Post(':scheduleId/holds')
        holdSeats(
            @Param('scheduleId', ParseIntPipe) scheduleId: number, //주소에 있는 회차ID(scheduleId)를 꺼내온다. parseIntPipe로 number로 변환, 숫자로 바꿔지지 않을시 400오류
           
            @Body() dto: HoldSeatsDto,
            @Req() req: Request,
        ){
            //서명이 확인된 쿠키에서 방문자 ID를 읽는다.
            //req.signedCookies는 서명을 검증한 쿠키만 담아주는 객체
            const guestId = req.signedCookies?.guestId;

            if(typeof guestId !== 'string' || guestId.length === 0){
                throw new UnauthorizedException(
                    '방문자 ID가 없습니다. /guest/identity로 방문자 ID를 발급받으세요.',
                );
            }
            return this.scheduleSeatsService.holdSeats(
                scheduleId,
                dto.scheduleSeatIds,
                guestId,
            )
        }
}
