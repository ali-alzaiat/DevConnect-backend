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
import { UserResponseDTO } from 'src/user/dto/user-response.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @PublicRoute()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: 200,
    type: LoginResponseDto,
    description: 'Login successful',
  })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @PublicRoute()
  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Signup' })
  @ApiResponse({ status: 200, description: 'Signup successful' })
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check login status' })
  @ApiResponse({
    status: 200,
    type: UserResponseDTO,
    description: 'User found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkLoginStatus(@CurrentUser() user: UserEntity) {
    return this.userService.findById(user.userId);
  }
}
