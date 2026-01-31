import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '@prisma/client';
import { IsArray, IsOptional, IsString } from 'class-validator';

export default class CreateSnippetDTO {
  @IsString()
  @ApiProperty()
  name: string;

  @IsArray()
  @ApiProperty()
  tags: string[];

  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  description?: string | null;
}
