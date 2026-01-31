import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SnippetService } from './snippet.service';
import { ApiQuery } from '@nestjs/swagger';
import SnippetResponseDTO from './dto/snippet-response.dto';
import CreateSnippetDTO from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';

@Controller('snippet')
export class SnippetController {
  constructor(private snippetService: SnippetService) {}

  @Get()
  @HttpCode(200)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllArticles(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<SnippetResponseDTO[]> {
    return await this.snippetService.getAllSnippets(page, limit);
  }

  @Get(':id')
  @HttpCode(200)
  getSnippetById(@Param('id') id: number): Promise<SnippetResponseDTO> {
    return this.snippetService.getSnippetById(id);
  }

  @Post('/create')
  @HttpCode(201)
  createSnippet(@Body() body: CreateSnippetDTO): Promise<SnippetResponseDTO> {
    return this.snippetService.createSnippet(body);
  }

  @Put(':id')
  @HttpCode(200)
  updateSnippet(
    @Param('id') id: number,
    @Body() updateSnippetDto: UpdateSnippetDto,
  ): Promise<SnippetResponseDTO> {
    return this.snippetService.updateSnippet(id, updateSnippetDto);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteSnippet(@Param('id') id: number) {
    return this.snippetService.deleteSnippet(id);
  }
}
