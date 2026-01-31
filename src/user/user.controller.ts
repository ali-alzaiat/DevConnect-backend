import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAllUsers() {
    return this.userService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findUserByID(@Param('id') id: string) {
    return this.userService.findById(+id);
  }

  @Get(':email')
  @HttpCode(HttpStatus.OK)
  findUserByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
