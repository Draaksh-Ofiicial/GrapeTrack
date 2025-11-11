import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * @CurrentOrg() - Extracts the current organization from the authenticated user's JWT
 *
 * Usage:
 *   @Post('tasks')
 *   @UseGuards(JwtAuthGuard, OrganizationGuard)
 *   createTask(
 *     @CurrentOrg() org: AuthenticatedUser['currentOrganization'],
 *     @Body() dto: CreateTaskDto,
 *   ) {
 *     // org will be the current organization object with id, name, slug, and role
 *   }
 */
export const CurrentOrg = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return user.currentOrganization;
  },
);
