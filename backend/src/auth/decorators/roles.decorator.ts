import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles() - Sets allowed roles for a route or controller
 *
 * Used in conjunction with RolesGuard to validate user permissions
 *
 * Usage:
 *   @Roles('admin', 'teamLead')
 *   @Post('organizations/:orgId/tasks')
 *   createTask(@Body() dto: CreateTaskDto) {
 *     // Only users with admin or teamLead role in current org can access
 *   }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
