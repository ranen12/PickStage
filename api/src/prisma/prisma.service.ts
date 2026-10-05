import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';


@Injectable()
export class PrismaService extends PrismaClient
implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { //NEST가 이 서비스를 초기화할때 DB 연결
    await this.$connect();
  }

  async onModuleDestroy() { //NEST가 이 서비스를 파괴할때 DB 연결 해제
    await this.$disconnect();
  }
}
