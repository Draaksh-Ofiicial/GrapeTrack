import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { eq, and } from 'drizzle-orm';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';
import { type Database, DATABASE } from '../../database/database.module';
import {
  userOrganizations,
  organizations,
  roles,
  permissions,
  rolePermissions,
} from '../../database/schema';

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * OrganizationGuard - Validates that:
 * 1. User is authenticated
 * 2. User has organization context (either in JWT or from route params)
 * 3. User is accessing an organization they belong to
 *
 * If orgId is in route params but not in JWT, this guard will:
 * - Verify user belongs to that organization
 * - Add organization context to the request
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, OrganizationGuard)
 *   @Get('organizations/:orgId/tasks')
 *   getTasks(@Param('orgId') orgId: string) {
 *     // Guard ensures user can only access their own org
 *   }
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    // Check if user is authenticated
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get orgId from route params
    const { orgId } = request.params as Record<string, string>;

    // If orgId is in route params, verify user belongs to it
    if (orgId) {
      // Check if user has organization context in JWT
      if (user.currentOrganization && user.currentOrganization.id === orgId) {
        // User has valid JWT with this org, allow access
        return true;
      }

      // JWT doesn't have this org, fetch from database to verify membership
      const orgData = await this.db
        .select({
          organizationId: organizations.id,
          organizationName: organizations.name,
          organizationSlug: organizations.slug,
          roleId: userOrganizations.roleId,
          roleName: roles.name,
          roleSlug: roles.slug,
        })
        .from(userOrganizations)
        .innerJoin(
          organizations,
          eq(userOrganizations.organizationId, organizations.id),
        )
        .leftJoin(roles, eq(userOrganizations.roleId, roles.id))
        .where(
          and(
            eq(userOrganizations.userId, user.id),
            eq(userOrganizations.organizationId, orgId),
            eq(userOrganizations.status, 'active'),
          ),
        )
        .limit(1);

      if (orgData.length === 0) {
        throw new ForbiddenException(
          'You do not have access to this organization',
        );
      }

      // Verify and enrich user object with organization context
      const org = orgData[0];
      const rolePerms = await this.db
        .select({
          slug: permissions.slug,
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(eq(rolePermissions.roleId, org.roleId));

      // Update user object with organization context
      user.currentOrganization = {
        id: org.organizationId,
        name: org.organizationName,
        slug: org.organizationSlug,
        role: {
          id: org.roleId,
          name: org.roleName || 'Unknown',
          slug: org.roleSlug || 'unknown',
          permissions: rolePerms.map((p) => p.slug),
        },
      };

      return true;
    }

    // No orgId in route params, check if user has organization context in JWT
    if (user.currentOrganization) {
      return true;
    }

    // No organization context available
    throw new ForbiddenException(
      'User does not have organization context. Please select an organization.',
    );
  }
}
