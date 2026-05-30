import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/user/user.service';
import { User } from '@prisma/client';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async signup(dto: SignupDto) {
    this.logger.log('signing up', dto.email);
    const user = await this.userService.create(dto);
    this.logger.log('signed up successfully', dto.email);
    return user;
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    let user: User;
    try {
      user = await this.userService.findByEmailWithPassword(dto.email);
    } catch {
      this.logger.warn(`login failed because user doesn't exist`, dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare plain text password with the Hash in DB
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`login failed because of invalid password`, dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT Token
    const payload = { sub: user.id, email: user.email };
    this.logger.log('logged in successfully', dto.email);
    return {
      token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
