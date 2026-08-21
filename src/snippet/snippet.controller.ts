import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SnippetService } from './snippet.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import SnippetResponseDTO from './dto/snippet-response.dto';
import CreateSnippetDTO from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { UserEntity } from 'src/user/entities/user.entity';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/ApiPaginatedResponse';

@ApiTags('Snippets')
@Controller('snippet')
export class SnippetController {
  constructor(private snippetService: SnippetService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all snippets with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Search snippets by name, description, or tag',
  })
  @ApiPaginatedResponse(SnippetResponseDTO)
  async getAllSnippets(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('q') q?: string,
  ): Promise<PaginatedResponseDto<SnippetResponseDTO>> {
    return await this.snippetService.getAllSnippets(page, limit, q);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get a snippet by ID' })
  @ApiResponse({ status: 200, type: SnippetResponseDTO })
  @ApiResponse({ status: 404, description: 'Snippet not found' })
  getSnippetById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SnippetResponseDTO> {
    return this.snippetService.getSnippetById(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new snippet' })
  @ApiResponse({ status: 201, type: SnippetResponseDTO })
  createSnippet(
    @Body() body: CreateSnippetDTO,
    @CurrentUser() user: UserEntity,
  ): Promise<SnippetResponseDTO> {
    return this.snippetService.createSnippet(body, user);
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a snippet' })
  @ApiResponse({ status: 200, type: SnippetResponseDTO })
  updateSnippet(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSnippetDto: UpdateSnippetDto,
    @CurrentUser() user: UserEntity,
  ): Promise<SnippetResponseDTO> {
    return this.snippetService.updateSnippet(id, updateSnippetDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a snippet' })
  @ApiResponse({ status: 204, description: 'Snippet deleted' })
  deleteSnippet(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.snippetService.deleteSnippet(id, user.userId);
  }
}
