import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  imports: [UserModule, PassportModule],
})
export class AuthModule {}
