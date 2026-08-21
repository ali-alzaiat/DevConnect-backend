import { SetMetadata } from '@nestjs/common';

export type AppRole = 'USER' | 'ADMIN';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to specific user roles.
 * Enforced by RolesGuard, which resolves the role from the database.
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
