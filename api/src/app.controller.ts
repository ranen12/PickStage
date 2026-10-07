import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { CloudinaryService } from './cloudinary/cloudinary.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @UploadedFile()
    file?: {
      buffer: Buffer;
      mimetype: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('이미지 파일을 첨부해 주세요.');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있어요.');
    }

    return this.cloudinaryService.uploadBuffer(file.buffer);
  }
}
