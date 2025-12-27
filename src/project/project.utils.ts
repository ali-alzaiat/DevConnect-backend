import { Project, Task, User } from "@prisma/client";
import { findRedisKeys, redis } from "src/common/redis/redis.utils";

export const invalidateProjectRedisCache = async () => {
    const keys = await findRedisKeys('projects_*');
    if (keys.length > 0) await redis.del(...keys);
}

export function mapProjectToDTO(project: Project & { owner: Pick<User, 'id' | 'name'>, tasks: Task[]}) {
    const { ownerId, ...rest } = project;
    return {
        ...rest,
        description: rest.description ?? undefined,
        tasks: project.tasks.map(task => ({
            ...task,
            description: task.description ?? undefined
        }))
    }
}