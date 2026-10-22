import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //.env에서 서버의 쿠키 서명용 비밀키를 가져온다.
  const cookieSecret = process.env.COOKIE_SECRET;

  if (!cookieSecret) {
    throw new Error('COOKIE_SECRET is not defined');
  }

  //쿠기가 있다면 읽어서 요청객체에 정리
  app.use(cookieParser(cookieSecret));

  app.enableShutdownHooks(); //종료 신호를 받을시 Nest의 종료 훅이 실행됨.

  // 프론트엔드 도메인 요청 허용
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
