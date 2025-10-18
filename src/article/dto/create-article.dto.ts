import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class createArticleDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  content: string;

  @IsNumber()
  authorId: number;
}
