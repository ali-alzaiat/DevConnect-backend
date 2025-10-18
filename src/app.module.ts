import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticleModule } from './article/article.module';
import { ProjectModule } from './project/project.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonLoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [ArticleModule, ProjectModule, PrismaModule, LoggerModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: WinstonLoggingInterceptor,
    },
  ],
})
export class AppModule {}
