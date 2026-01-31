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
import { Public } from './decorator/public.decorator';
import { ApiSecurity } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity({})
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity({})
  signup(@Body() singupDto: SignupDto) {
    return this.authService.signup(singupDto);
  }
}
