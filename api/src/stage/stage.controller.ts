import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { StageService } from './stage.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { PageRequestDto } from './dto/page-request.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('stage')
export class StageController {
  constructor(private readonly stageService: StageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createStageDto: CreateStageDto,
  ) {
    console.log('ehgowhogew');
    return this.stageService.create(createStageDto, file);
  }

  @Get()
  findAll(@Query() query: PageRequestDto) {
    console.log('StageController.findAll 호출됨');
    return this.stageService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stageService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStageDto: UpdateStageDto) {
    return this.stageService.update(+id, updateStageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stageService.remove(+id);
  }
}
