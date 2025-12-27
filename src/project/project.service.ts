import { Inject, Injectable, LoggerService, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { invalidateProjectRedisCache, mapProjectToDTO } from './project.utils';
import { Keyv } from '@keyv/redis';
import { ProjectResponseDto } from './dto/project-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    (this.logger as any).setContext(ProjectService.name);
  }

  private cacheKey(page: number = 1, limit: number = 10): string {
    return `articles_page_${page}_limit_${limit}`;
  }

  async invalidateArticlesCache() {
    invalidateProjectRedisCache();

    // Clear in-memory cache as well
    const memoryStore = this.cacheManager.stores[0] as Keyv;
    await memoryStore.clear();
  }
    
  async createProject(createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    this.logger.log('Creating a new project with title: ' + createProjectDto.title);
    const newProject = await this.prisma.project.create({
      data: {
        title: createProjectDto.title,
        description: createProjectDto.description,
        tasks: {
          create: createProjectDto.tasks?.map(task => ({
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            status: task.status,
          })) || [],
        },
        owner: {connect: {id: 1}}, // Temporary hardcoded owner
      },
      include: {
        tasks: true,
        owner: { select: { id: true, name: true } }
      }
    })
    this.logger.log('Project created successfully with title: ' + newProject.title);
    invalidateProjectRedisCache();
    return mapProjectToDTO(newProject);
  }

  async getAllProjects(page: number = 1, limit: number = 10): Promise<ProjectResponseDto[]> {
    const cacheKey = this.cacheKey(page, limit);
    const cachedProjects: ProjectResponseDto[] | undefined = await this.cacheManager.get(cacheKey);
    if (cachedProjects) {
      this.logger.log(`Returning cached projects for page ${page} with limit ${limit}`);
      return cachedProjects;
    }
    const projects = await this.prisma.project.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tasks: true,
        owner: { select: { id: true, name: true } }
      }
    });

    const res = projects.map(mapProjectToDTO);
    this.logger.log(`Fetched ${projects.length} projects from database`);
    this.cacheManager.set(cacheKey, res);
    return res;
  }

  async getProjectById(id: number): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        owner: { select: { id: true, name: true } }
      }
    });
    if(!project) {
      this.logger.warn(`Project with ID ${id} not found`);
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    this.logger.log(`Fetched project with ID ${id}`);
    return mapProjectToDTO(project);
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  async deleteProject(id: number): Promise<void> {
    try {
      await this.prisma.project.delete({
        where: { id },
      });
      this.logger.log(`Deleted project with ID ${id}`);
      await this.invalidateArticlesCache();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Project with ID ${id} not found for deletion`);
        throw new NotFoundException('Project not found');
      }
      throw error;
    }
  }
}
