import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import 'multer';
import { logger } from 'src/config/logger';
import { parseStageDate } from 'src/config/formatDate';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { PageRequestDto } from './dto/page-request.dto';

@Injectable()
export class StageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 공연 등록
   * @param createStageDto
   * @param file
   * @returns
   */
  async create(dto: CreateStageDto, file: Express.Multer.File) {
    logger.info(`stageService create started.`);

    if (!file) {
      throw new BadRequestException('대표 이미지를 선택해 주세요');
    }

    const posterUrl = await this.uploadImage(file);

    const stage = await this.prisma.stage.create({
      data: {
        title: dto.title,
        category: dto.category,
        startDate: parseStageDate(dto.startDate),
        endDate: parseStageDate(dto.endDate),
        price: Number(dto.price),
        runningTime: Number(dto.runningTime),
        rating: dto.rating,
        description: dto.description,
        posterUrl,
      },
    });

    logger.info(`stageService create ended.`);
    return stage;
  }

  /**
   * 공연 리스트
   * @returns
   */
  async findAll(query: PageRequestDto) {
    logger.info(`stageService findAll started.`);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.StageWhereInput = {
      ...(query.category?.length ? { category: { in: query.category } } : {}),
      ...(query.rating ? { rating: query.rating } : {}),
      ...(query.scheduleStatus === 'missing'
        ? { schedules: { none: {} } }
        : {}),
      ...(query.scheduleStatus === 'registered'
        ? { schedules: { some: {} } }
        : {}),
    };

    const orderBy: Prisma.StageOrderByWithRelationInput =
      query.sort === 'name' ? { title: 'asc' } : { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      this.prisma.stage.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { schedules: true },
          },
        },
      }),
      this.prisma.stage.count({ where }),
    ]);

    logger.info(`stageService findAll ended.`);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 공연 상세 내용 찾기
   * @param id
   * @returns
   */
  async findOne(id: number) {
    logger.info(`stageService findOne started. id: ${id}`);

    const result = await this.prisma.stage.findUnique({
      where: { id },
      include: { schedules: true },
    });

    if (!result) throw new NotFoundException(`해당 공연을 찾을 수 없습니다`);

    logger.info(`stageService findOne ended. id: ${id}`);
    return result;
  }

  update(id: number, updateStageDto: UpdateStageDto) {
    return `This action updates a #${id} stage`;
  }

  remove(id: number) {
    return `This action removes a #${id} stage`;
  }

  /**
   * 이미지파일 업로드
   * @param file
   */
  async uploadImage(file: Express.Multer.File) {
    logger.info(`stageService findOne started.`);
    logger.info(`fileName: ${file.originalname}`);

    if (!file) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }

    if (!process.env.CLOUDINARY_URL) {
      throw new BadRequestException('CLOUDINARY_URL이 설정되지 않았습니다.');
    }

    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      {
        folder: 'stages',
        resource_type: 'image',
      },
    );

    logger.info(`stageService findOne ended.`);
    return result.secure_url;
  }
}
