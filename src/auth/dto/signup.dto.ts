import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class SignupDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty()
  @IsString()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password is too weak. It must have 1 uppercase, 1 lowercase, 1 number, and 1 symbol',
    },
  )
  password: string;

  @ApiProperty()
  @IsString()
  name: string;
}
