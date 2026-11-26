import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post(':stageId')
  create(
    @Param('stageId', ParseIntPipe) stageId: number,
    @Body() createScheduleDto: CreateScheduleDto,
  ) {
    return this.scheduleService.create(stageId, createScheduleDto);
  }

  @Get(':stageId')
  findOne(@Param('stageId', ParseIntPipe) stageId: number) {
    return this.scheduleService.findOne(stageId);
  }
}
