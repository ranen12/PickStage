import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { ScheduleSeatsService } from './schedule-seats.service';
import { HoldSeatsDto } from './dto/hold-seats.dto';
import type { Request } from 'express';
import { ConfirmReservationDto } from './dto/confirm-reservation.dto';

@Controller('schedules')
export class ScheduleSeatsController {
    constructor(
        private readonly scheduleSeatsService: ScheduleSeatsService){}

        //GET /schedules/10/seats 형태
        @Get(':scheduleId/seats')
        findBySchedule( //parseIntPipe로 scheduleId를 number로 변환, 숫자로 바꿔지지 않을시 400오류 
            @Param('scheduleId', ParseIntPipe) scheduleId: number,
            @Req() req: Request,
        ){
            //쿠키가 있으면 방문자 Id를 꺼냄, 없으면 undefined
            //조회는 쿠기가 없어도 할 수 있어야 하므로 에러를 던지지 않음.
            const cookie = req.signedCookies?.guestId;
            const guestId = typeof cookie ==='string' && cookie.length > 0 ? cookie : undefined;
            
                return this.scheduleSeatsService.findByschedule(scheduleId, guestId);
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

        @Delete(':scheduleId/holds')
        releaseHolds(
            @Param('scheduleId', ParseIntPipe) scheduleId: number,
            @Req() req: Request,
        ){
            const guestId = req.signedCookies?.guestId;

            if(typeof guestId !== 'string' || guestId.length === 0){
                throw new UnauthorizedException('방문자 쿠키가 필요합니다.')
            }
            return this.scheduleSeatsService.releaseHolds(scheduleId, guestId);
        }

        //POST /schedules/10/reservations
        @Post(':scheduleId/reservations')
        confirmReservation(
            @Param('scheduleId', ParseIntPipe) scheduleId: number,
            @Body() dto: ConfirmReservationDto,
            @Req() req: Request,
        ){
            //확정은 내가 잡은 좌석인지 확인해야하므로 쿠키가 반드시 필요함
            const guestId = req.signedCookies?.guestId;

            if(typeof guestId !== 'string' || guestId.length === 0){
                throw new UnauthorizedException('방문자 쿠키가 필요합니다.')
            }

            return this.scheduleSeatsService.confirmReservation(
              scheduleId,
              dto.scheduleSeatIds,
              dto.customerName,
              dto.customerPhone,
              guestId,
            )
        }
}
