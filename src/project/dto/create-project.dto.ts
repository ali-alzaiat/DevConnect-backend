import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Task } from '../entities/task.entity';

export class CreateProjectDto {
  @IsString()
  @ApiProperty()
  title: string;

  @IsString()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  description?: string;

  @IsArray()
  @ApiProperty({ type: [Task], required: false })
  @IsOptional()
  tasks?: Task[];
}
