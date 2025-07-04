import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticalModule } from './artical/artical.module';

@Module({
  imports: [ArticalModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
