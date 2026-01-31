import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/user/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // "Look for the token in the 'Authorization' header"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // "Reject the token if it is expired"
      ignoreExpiration: false,

      // "Use this secret key to verify the signature"
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any): Promise<UserEntity> {
    // The 'payload' is the JSON data that was inside the token.
    // We return a simple object that will be available as 'req.user' in controllers.
    return { userId: payload.sub, email: payload.email };
  }
}
