import { Project, Task, User } from '@prisma/client';

export function mapProjectToDTO(
  project: Project & { owner: Pick<User, 'id' | 'name'> | null; tasks: Task[] },
) {
  const { ownerId, ...rest } = project;
  return {
    ...rest,
    description: rest.description ?? undefined,
    tasks: project.tasks.map((task) => ({
      ...task,
      description: task.description ?? undefined,
    })),
  };
}
