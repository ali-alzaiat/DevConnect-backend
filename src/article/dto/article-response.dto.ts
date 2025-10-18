import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export default class ArticleResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  content: string;

  @IsNumber()
  authorId: number;

  @IsString()
  authorName: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}
