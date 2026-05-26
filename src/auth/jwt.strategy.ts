import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // "Look for the token in the 'Authorization' header"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // "Reject the token if it is expired"
      ignoreExpiration: false,

      // "Use this secret key to verify the signature"
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKey',
    });
  }

  validate(payload: { sub: number; email: string }): UserEntity {
    // The 'payload' is the JSON data that was inside the token.
    // We return a simple object that will be available as 'req.user' in controllers.
    return { userId: payload.sub, email: payload.email };
  }
}
