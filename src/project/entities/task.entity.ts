import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum TaskStatusEnum {
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export class Task {
  @IsNumber()
  @ApiProperty()
  @IsOptional()
  id?: number;

  @IsString()
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  description?: string;

  @Type(() => Date)
  @IsDate()
  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  @IsEnum(TaskStatus)
  status: TaskStatusEnum;
}
