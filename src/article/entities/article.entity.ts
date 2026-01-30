import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class Article {
  @IsNumber()
  @ApiProperty()
  @IsOptional()
  id: number;

  @IsString()
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  description?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  content?: string;

  @Type(() => Date)
  @IsDate()
  @ApiProperty()
  updatedAt: Date;
}
