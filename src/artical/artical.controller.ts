import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ArticalService } from './artical.service';
import { createArticalDto } from './create-artical.dto';

@Controller('artical')
export class ArticalController {
  constructor(private articalService: ArticalService) {}

  @Get()
  getAllArticals(): string {
    return this.articalService.getAllArticals();
  }

  @Get('/:articalId')
  getArticalById(@Param('articalId') id: number): string {
    return this.articalService.getArticalById(id);
  }

  @Post('/create')
  createArtical(@Body() body: createArticalDto): string {
    console.log('Creating article with data:', body);
    return 'This is a new article created!';
  }
}
