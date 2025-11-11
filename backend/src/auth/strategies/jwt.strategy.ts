import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { eq, and } from 'drizzle-orm';
import { Request } from 'express';
import { type Database, DATABASE } from '../../database/database.module';
import {
  users,
  userOrganizations,
  organizations,
  roles,
  permissions,
  rolePermissions,
} from '../../database/schema';
import { Inject } from '@nestjs/common';

interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
}

export interface JwtPayload {
  sub: string; // userId
  orgId?: string; // organizationId
  roleInOrg?: string; // role name in organization
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  currentOrganization?: {
    id: string;
    name: string;
    slug: string;
    role: {
      id: string;
      name: string;
      slug: string;
      permissions: string[];
    };
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: RequestWithCookies) => {
          return request.cookies?.['access_token'];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const { sub: userId, orgId } = payload;

    // Fetch user
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Convert null to undefined for avatar
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || undefined,
    };

    let currentOrganization: AuthenticatedUser['currentOrganization'];

    // If orgId is provided, fetch organization and role context
    if (orgId) {
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
            eq(userOrganizations.userId, userId),
            eq(userOrganizations.organizationId, orgId),
            eq(userOrganizations.status, 'active'),
          ),
        )
        .limit(1);

      if (orgData.length > 0) {
        const org = orgData[0];

        // Get permissions for this role
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

        currentOrganization = {
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
      }
    }

    return {
      ...authenticatedUser,
      currentOrganization,
    };
  }
}
