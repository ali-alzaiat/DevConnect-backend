import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { SnippetService } from './snippet.service';
import { ApiQuery } from '@nestjs/swagger';
import SnippetResponseDTO from './dto/snippet-response.dto';

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
}
