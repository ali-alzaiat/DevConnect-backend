import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticalModule } from './artical/artical.module';
import { ProjectModule } from './project/project.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [ArticalModule, ProjectModule, PrismaModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
