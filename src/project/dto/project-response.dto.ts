import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsDate,
  IsNumber,
  IsObject,
  IsString,
} from 'class-validator';
import { Task } from '../entities/task.entity';

export class ProjectResponseDto {
  @IsNumber()
  @ApiProperty()
  id: number;

  @IsString()
  @ApiProperty()
  title: string;

  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsArray()
  @ApiProperty({ type: [Task] })
  tasks: Task[];

  @IsObject()
  @ApiProperty({ required: false })
  owner: {
    id: number;
    name: string;
  } | null;

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
