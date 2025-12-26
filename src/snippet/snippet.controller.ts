import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { SnippetService } from './snippet.service';
import { ApiQuery } from '@nestjs/swagger';
import SnippetResponseDTO from './dto/snippet-response.dto';
import CreateSnippetDTO from './dto/create-snippet.dto';

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

    @Get('/:snippetId')
    @HttpCode(200)
    getSnippetById(@Param('snippetId') id: number): Promise<SnippetResponseDTO> {
        return this.snippetService.getSnippetById(id);
    }

    @Post('/create')
    @HttpCode(201)
    createSnippet(@Body() body: CreateSnippetDTO): Promise<SnippetResponseDTO> {
        return this.snippetService.createSnippet(body);
    }
}
