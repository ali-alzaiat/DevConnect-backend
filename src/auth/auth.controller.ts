import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { UserService } from 'src/user/user.service';
import { PublicRoute } from './decorator/public-route.decorator';
import { CurrentUser } from './decorator/current-user.decorator';
import { UserEntity } from 'src/user/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @PublicRoute()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @PublicRoute()
  @Post('signup')
  @HttpCode(HttpStatus.OK)
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async checkLoginStatus(@CurrentUser() user: UserEntity) {
    return this.userService.findById(user.userId);
  }
}
