import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * RolesGuard - Validates that user has the required role
 *
 * Works in conjunction with @Roles() decorator
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
 *   @Roles('admin', 'teamLead')
 *   @Post('organizations/:orgId/tasks')
 *   createTask(@Body() dto: CreateTaskDto) {
 *     // Only admin and teamLead roles can access
 *   }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
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

    // Check if user's role is in the required roles
    const userRole = user.currentOrganization.role.name;
    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}. Your role: ${userRole}`,
      );
    }

    return true;
  }
}
