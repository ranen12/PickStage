import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableShutdownHooks();//종료 신호를 받을시 Nest의 종료 훅이 실행됨.
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
