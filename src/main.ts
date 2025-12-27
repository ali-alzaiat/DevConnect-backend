import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: ['https://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // if using cookies or sessions
  });

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  app.useLogger(logger);

  //Swagger setup
  const config = new DocumentBuilder()
    .setTitle('DevConnect API')
    .setDescription('The DevConnect API documentation')
    .setVersion('1.0')
    .build();

  const options = { operationIdFactory: (controllerKey: string, methodKey: string) => methodKey };

  const documentFactory = () => SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
