import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ArticalService } from './artical.service';
import { createArticalDto } from './dto/create-artical.dto';
import ArticalResponseDto from './dto/artical-response.dto';

@Controller('artical')
export class ArticalController {
  constructor(private articalService: ArticalService) {}

  @Get()
  @HttpCode(200)
  async getAllArticals(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<ArticalResponseDto[]> {
    return await this.articalService.getAllArticals(page, limit);
  }

  @Get('/:articalId')
  @HttpCode(200)
  getArticalById(@Param('articalId') id: number): Promise<ArticalResponseDto> {
    return this.articalService.getArticalById(id);
  }

  @Post('/create')
  @HttpCode(201)
  createArtical(@Body() body: createArticalDto): Promise<ArticalResponseDto> {
    return this.articalService.createArtical(body);
  }
}
