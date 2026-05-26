import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { mapProjectToDTO } from './project.utils';
import { UserEntity } from 'src/user/entities/user.entity';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { ProjectResponseDto } from './dto/project-response.dto';

@Injectable()
export class ProjectService {
  private readonly logger: LoggerService = new Logger(ProjectService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async getCacheKey(page: number, limit: number): Promise<string> {
    const version = await this.getProjectCacheVersion();
    return `projects_v${version}_page_${page}_limit_${limit}`;
  }

  // Helper to get the current version
  private async getProjectCacheVersion(): Promise<number> {
    const version = await this.cacheManager.get('project_version');
    return (version as number) || 1;
  }

  // Helper to bump version
  private async incrementProjectCacheVersion() {
    const version = await this.getProjectCacheVersion();
    // Set version in all stores
    await this.cacheManager.set('project_version', version + 1, 0); // 0 = infinite TTL
  }

  async invalidateProjectsCache() {
    await this.incrementProjectCacheVersion();
  }

  async createProject(
    createProjectDto: CreateProjectDto,
    user: UserEntity,
  ): Promise<ProjectResponseDto> {
    this.logger.log(
      'Creating a new project with title: ' + createProjectDto.title,
    );
    const newProject = await this.prisma.project.create({
      data: {
        title: createProjectDto.title,
        description: createProjectDto.description,
        tasks: {
          create:
            createProjectDto.tasks?.map((task) => ({
              title: task.title,
              description: task.description,
              dueDate: task.dueDate,
              status: task.status,
            })) || [],
        },
        owner: { connect: { id: user.userId } },
      },
      include: {
        tasks: true,
        owner: { select: { id: true, name: true } },
      },
    });
    this.logger.log(
      'Project created successfully with title: ' + newProject.title,
    );
    await this.invalidateProjectsCache();
    return mapProjectToDTO(newProject);
  }

  async getAllProjects(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponseDto<ProjectResponseDto>> {
    const cacheKey = await this.getCacheKey(page, limit);
    const cachedData: PaginatedResponseDto<ProjectResponseDto> | undefined =
      await this.cacheManager.get(cacheKey);

    if (cachedData) {
      this.logger.log(
        `Returning cached projects for page ${page} with limit ${limit}`,
      );
      return cachedData;
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tasks: true,
          owner: { select: { id: true, name: true } },
        },
      }),
      this.prisma.project.count(),
    ]);

    const data = projects.map(mapProjectToDTO);
    const totalPages = Math.ceil(total / limit);

    const res: PaginatedResponseDto<ProjectResponseDto> = {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    this.logger.log(
      `Fetched ${projects.length} projects from database (Total: ${total})`,
    );
    await this.cacheManager.set(cacheKey, res);
    return res;
  }

  async getProjectById(id: number): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        owner: { select: { id: true, name: true } },
      },
    });
    if (!project) {
      this.logger.warn(`Project with ID ${id} not found`);
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    this.logger.log(`Fetched project with ID ${id}`);
    return mapProjectToDTO(project);
  }

  async update(id: number, updateProjectDto: UpdateProjectDto, userId: number) {
    this.logger.log(`Updating project with ID: ${id}`);

    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (existingProject.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this project',
      );
    }

    const { tasks, ...projectData } = updateProjectDto;

    const updatedProject = await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: projectData,
        include: { tasks: true },
      });

      if (tasks) {
        const tasksToUpdate = tasks.filter((t) => t.id);
        const tasksToCreate = tasks.filter((t) => !t.id);

        const incomingIds: number[] = tasksToUpdate.map((t) => t.id!);
        await tx.task.deleteMany({
          where: {
            projectId: id,
            id: { notIn: incomingIds },
          },
        });

        await Promise.all(
          tasksToUpdate.map((task) =>
            tx.task.update({
              where: { id: task.id },
              data: {
                title: task.title,
                description: task.description,
                status: task.status,
                dueDate: task.dueDate,
              },
            }),
          ),
        );

        if (tasksToCreate.length > 0) {
          await tx.task.createMany({
            data: tasksToCreate.map((task) => ({
              ...task,
              projectId: id,
            })),
          });
        }
      }

      return tx.project.findUnique({
        where: { id },
        include: {
          tasks: true,
          owner: { select: { id: true, name: true } },
        },
      });
    });

    await this.invalidateProjectsCache();

    if (!updatedProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return mapProjectToDTO(updatedProject);
  }

  async deleteProject(id: number, userId: number): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this project',
      );
    }

    await this.prisma.project.delete({
      where: { id },
    });
    this.logger.log(`Deleted project with ID ${id}`);
    await this.invalidateProjectsCache();
  }
}
