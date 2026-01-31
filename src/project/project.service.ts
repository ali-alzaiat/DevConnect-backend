import {
  Inject,
  Injectable,
  InternalServerErrorException,
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
import { ProjectResponseDto } from './dto/project-response.dto';
import { Prisma, Project, Task, User } from '@prisma/client';
import { UserEntity } from 'src/user/entities/user.entity';

type ProjectWithOwners = Project & {
  owner: Pick<User, 'id' | 'name'> | null;
  tasks: Task[];
};

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
    let newProject: ProjectWithOwners;

    try {
      // 1. Database Operation
      newProject = await this.prisma.project.create({
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
    } catch (error) {
      this.logger.error('Failed to create project in database', error.stack);
      throw new InternalServerErrorException(
        'Could not create project due to database error',
      );
    }
    this.logger.log(
      'Project created successfully with title: ' + newProject.title,
    );
    this.invalidateProjectsCache();
    return mapProjectToDTO(newProject);
  }

  async getAllProjects(
    page: number = 1,
    limit: number = 10,
  ): Promise<ProjectResponseDto[]> {
    const cacheKey = await this.getCacheKey(page, limit);
    const cachedProjects: ProjectResponseDto[] | undefined =
      await this.cacheManager.get(cacheKey);
    if (cachedProjects) {
      this.logger.log(
        `Returning cached projects for page ${page} with limit ${limit}`,
      );
      return cachedProjects;
    }
    let projects: ProjectWithOwners[];
    try {
      projects = await this.prisma.project.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tasks: true,
          owner: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      this.logger.error('Failed to get projects from database', error.stack);
      throw new InternalServerErrorException(
        'Could not get projects due to database error',
      );
    }

    const res = projects.map(mapProjectToDTO);
    this.logger.log(`Fetched ${projects.length} projects from database`);
    this.cacheManager.set(cacheKey, res);
    return res;
  }

  async getProjectById(id: number): Promise<ProjectResponseDto> {
    let project: ProjectWithOwners | null;
    try {
      project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          tasks: true,
          owner: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get project with id ${id} from database`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not get project due to database error',
      );
    }
    if (!project) {
      this.logger.warn(`Project with ID ${id} not found`);
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    this.logger.log(`Fetched project with ID ${id}`);
    return mapProjectToDTO(project);
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    this.logger.log(`Updating project with ID: ${id}`);

    const { tasks, ...projectData } = updateProjectDto;

    try {
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

      return mapProjectToDTO(updatedProject!);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Project with ID ${id} not found for update`);
        throw new NotFoundException('Project not found');
      }
      throw error;
    }
  }

  async deleteProject(id: number): Promise<void> {
    try {
      await this.prisma.project.delete({
        where: { id },
      });
      this.logger.log(`Deleted project with ID ${id}`);
      await this.invalidateProjectsCache();
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
