import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { UserEntity } from 'src/user/entities/user.entity';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { ProjectListingFilter } from 'src/types/project-list-filters';
import { ApiPaginatedResponse } from 'src/common/decorators/ApiPaginatedResponse';

@ApiTags('Projects')
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  createProject(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: UserEntity,
  ): Promise<ProjectResponseDto> {
    return this.projectService.createProject(createProjectDto, user);
  }

  @Post('list')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all projects with pagination' })
  @ApiBody({ type: ProjectListingFilter })
  @ApiPaginatedResponse(ProjectResponseDto)
  async getAllProjects(
    @Body() filters: ProjectListingFilter,
    @CurrentUser() user: UserEntity,
  ): Promise<PaginatedResponseDto<ProjectResponseDto>> {
    return await this.projectService.getAllProjects(filters, user.userId);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  getProjectById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ): Promise<ProjectResponseDto> {
    return this.projectService.getProjectById(id, user.userId);
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.projectService.update(id, updateProjectDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 204, description: 'Project deleted' })
  deleteProject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.projectService.deleteProject(id, user.userId);
  }
}
