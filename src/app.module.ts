import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticleModule } from './article/article.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonLoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { SnippetModule } from './snippet/snippet.module';
import { ProjectModule } from './project/project.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ArticleModule,
    PrismaModule,
    LoggerModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [new Keyv(), new KeyvRedis(process.env.REDIS_URL)],
          ttl: 1000 * 60 * 5, // 5 minutes in milliseconds
        };
      },
    }),
    SnippetModule,
    ProjectModule,
    AuthModule,
    UserModule,
    JwtModule.register({
      global: true, // Optional: makes it available everywhere without re-importing
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '1h' },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: WinstonLoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
