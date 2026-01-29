import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ApiQuery } from '@nestjs/swagger';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @HttpCode(201)
  createProject(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectService.createProject(createProjectDto);
  }

  @Get()
  @HttpCode(200)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllProjects(): Promise<ProjectResponseDto[]> {
    return this.projectService.getAllProjects();
  }

  @Get(':id')
  @HttpCode(200)
  getProjectById(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectService.getProjectById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(+id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteProject(@Param('id') id: string) {
    return this.projectService.deleteProject(+id);
  }
}
