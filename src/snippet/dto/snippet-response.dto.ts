import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export default class SnippetResponseDTO {
  @IsNumber()
  @ApiProperty()
  id: number;

  @IsString()
  @ApiProperty()
  name: string;

  @IsArray()
  @ApiProperty({ type: String, isArray: true })
  tags: string[];

  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  description?: string | null;

  @IsDate()
  @ApiProperty()
  createdAt: Date;

  @IsDate()
  @ApiProperty()
  updatedAt: Date;

  @IsIn(['ADMIN', 'OWNER', 'EDIT', 'SHARE', 'VIEW'])
  @ApiProperty({
    required: false,
    enum: ['ADMIN', 'OWNER', 'EDIT', 'SHARE', 'VIEW'],
  })
  permission?: string;
}
