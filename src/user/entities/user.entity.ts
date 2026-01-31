import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UserEntity {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  name?: string;

  @IsString()
  @ApiProperty()
  email: string;

  @IsNumber()
  @ApiProperty({ required: false })
  userId: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  password?: string;
}
