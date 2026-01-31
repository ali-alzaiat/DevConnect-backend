import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/user/user.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async signup(dto: SignupDto) {
    this.logger.log('signing up', dto);
    let user: Partial<User>;
    try {
      user = await this.userService.create(dto);
    } catch (error) {
      this.logger.error('failed to sign up');
      throw error;
    }
    this.logger.log('signed up successfully', dto);
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      this.logger.warn(`login failed because user doesn't exist`, dto);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare plain text password with the Hash in DB
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`login failed because of invalid password`, dto);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT Token
    const payload = { sub: user.id, email: user.email };
    this.logger.log('logged in successfully', dto);
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
