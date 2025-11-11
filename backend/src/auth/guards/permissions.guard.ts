import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * PermissionsGuard - Validates that user has the required permissions
 *
 * Works in conjunction with @Permissions() decorator
 * Uses dynamic role-permission relationships stored in database
 *
 * Permissions are fetched in JWT strategy and cached in currentOrganization.role.permissions
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, OrganizationGuard, PermissionsGuard)
 *   @Permissions('tasks.create', 'tasks.update')
 *   @Post('organizations/:orgId/tasks')
 *   createTask(@Body() dto: CreateTaskDto) {
 *     // User must have at least one of these permissions
 *   }
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from @Permissions() decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are specified, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    // Check if user is authenticated
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has organization context
    if (!user.currentOrganization) {
      throw new ForbiddenException('User does not have organization context');
    }

    // Get user's permissions from the role (already fetched in JWT strategy)
    const userPermissions = user.currentOrganization.role.permissions;

    // Check if user has at least one required permission
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `This action requires one of the following permissions: ${requiredPermissions.join(', ')}. Your permissions: ${userPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
