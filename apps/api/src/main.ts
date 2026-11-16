import { config } from "dotenv";
import { resolve } from "node:path";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./common/prisma-exception.filter";

config({ path: resolve(__dirname, "../../../.env") });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter));
  await app.listen(Number(process.env.API_PORT ?? 3001));
}

bootstrap();
