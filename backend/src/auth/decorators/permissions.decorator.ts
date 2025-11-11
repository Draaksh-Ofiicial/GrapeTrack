import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for an endpoint
 *
 * Usage:
 *   @Permissions('tasks.create', 'tasks.update')
 *   @Post('tasks')
 *   createTask() {
 *     // User must have at least one of these permissions
 *   }
 *
 * @param permissions - Permission slugs (e.g., 'tasks.create', 'tasks.view')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
