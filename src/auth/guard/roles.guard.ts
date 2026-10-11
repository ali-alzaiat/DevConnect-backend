import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ROLES_KEY, AppRole } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Resolve required roles from handler + controller
    const requiredRoles = this.reflector.getAllAndOverride<
      AppRole[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { userId?: number } }>();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Access denied');
    }

    // Role is resolved from the database so role changes take effect
    // immediately, without waiting for the JWT to be refreshed.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || !requiredRoles.includes(user.role as AppRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
