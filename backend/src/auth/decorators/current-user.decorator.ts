import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * @CurrentUser() - Extracts the authenticated user from the JWT
 *
 * Usage:
 *   @Post('tasks')
 *   @UseGuards(JwtAuthGuard)
 *   createTask(
 *     @CurrentUser() user: AuthenticatedUser,
 *     @Body() dto: CreateTaskDto,
 *   ) {
 *     // user will be the authenticated user object with id, email, name, and currentOrganization
 *   }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    return request.user;
  },
);
