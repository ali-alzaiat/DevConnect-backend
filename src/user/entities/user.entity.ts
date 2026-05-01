import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsObject } from 'class-validator';

export class UserPreferenceEntity {
  @IsString()
  @ApiProperty()
  theme: string;

  @IsString()
  @ApiProperty()
  language: string;
}

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

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false, type: UserPreferenceEntity })
  preferences?: UserPreferenceEntity;
}
