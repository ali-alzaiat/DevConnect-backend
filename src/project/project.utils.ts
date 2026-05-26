import { Project, Task, User } from '@prisma/client';
import { TaskStatusEnum } from './entities/task.entity';
import { ProjectResponseDto } from './dto/project-response.dto';

export function mapProjectToDTO(
  project: Project & { owner: Pick<User, 'id' | 'name'> | null; tasks: Task[] },
): ProjectResponseDto {
  return {
    id: project.id,
    title: project.title,
    description: project.description ?? undefined,
    owner: project.owner,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    tasks: project.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description ?? undefined,
      dueDate: task.dueDate,
      status: task.status as TaskStatusEnum,
      projectId: task.projectId,
    })),
  };
}
