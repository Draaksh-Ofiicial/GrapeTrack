import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { type Database, DATABASE } from '../database/database.module';
import {
  roles,
  userOrganizations,
  permissions,
  rolePermissions,
  type Role,
} from '../database/schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(organizationId: string, dto: CreateRoleDto): Promise<Role> {
    // Check if slug already exists in this organization
    const existing = await this.db
      .select()
      .from(roles)
      .where(
        and(eq(roles.organizationId, organizationId), eq(roles.slug, dto.slug)),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(
        'Role with this slug already exists in this organization',
      );
    }

    const [role] = await this.db
      .insert(roles)
      .values({
        organizationId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        color: dto.color,
        level: dto.level,
        isSystemRole: dto.isSystemRole || false,
      })
      .returning();

    return role;
  }

  async findAll(organizationId: string): Promise<Role[]> {
    return this.db
      .select()
      .from(roles)
      .where(eq(roles.organizationId, organizationId));
  }

  async findOne(id: string, organizationId: string): Promise<Role> {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)))
      .limit(1);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async findBySlug(slug: string, organizationId: string): Promise<Role> {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(
        and(eq(roles.slug, slug), eq(roles.organizationId, organizationId)),
      )
      .limit(1);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateRoleDto,
  ): Promise<Role> {
    const role = await this.findOne(id, organizationId);

    // Check if it's a system role
    if (role.isSystemRole) {
      throw new BadRequestException('Cannot modify system roles');
    }

    // If slug is being updated, check for conflicts
    if (dto.slug && dto.slug !== role.slug) {
      const existing = await this.db
        .select()
        .from(roles)
        .where(
          and(
            eq(roles.organizationId, organizationId),
            eq(roles.slug, dto.slug),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException('Role with this slug already exists');
      }
    }

    const [updated] = await this.db
      .update(roles)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)))
      .returning();

    return updated;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const role = await this.findOne(id, organizationId);

    // Check if it's a system role
    if (role.isSystemRole) {
      throw new BadRequestException('Cannot delete system roles');
    }

    // Check if any users have this role
    const usersWithRole = await this.db
      .select()
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.roleId, id),
          eq(userOrganizations.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (usersWithRole.length > 0) {
      throw new BadRequestException(
        'Cannot delete role that is assigned to users. Reassign users first.',
      );
    }

    await this.db
      .delete(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)));
  }

  async createDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      // Tasks permissions
      { name: 'View Tasks', slug: 'tasks.view', category: 'tasks' },
      { name: 'View All Tasks', slug: 'tasks.view_all', category: 'tasks' },
      { name: 'Create Tasks', slug: 'tasks.create', category: 'tasks' },
      { name: 'Update Tasks', slug: 'tasks.update', category: 'tasks' },
      { name: 'Edit Tasks', slug: 'tasks.edit', category: 'tasks' },
      { name: 'Delete Tasks', slug: 'tasks.delete', category: 'tasks' },
      { name: 'Assign Tasks', slug: 'tasks.assign', category: 'tasks' },
      { name: 'Comment on Tasks', slug: 'tasks.comment', category: 'tasks' },

      // Users/Team permissions
      { name: 'View Users', slug: 'users.view', category: 'users' },
      { name: 'View Team', slug: 'team.view', category: 'users' },
      { name: 'Invite Users', slug: 'users.invite', category: 'users' },
      { name: 'Invite Team Members', slug: 'team.invite', category: 'users' },
      { name: 'Manage Users', slug: 'users.manage', category: 'users' },
      { name: 'Manage Team', slug: 'team.manage', category: 'users' },

      // Organizations permissions
      {
        name: 'Manage Organization',
        slug: 'organizations.manage',
        category: 'organizations',
      },
      {
        name: 'View Organization',
        slug: 'organizations.view',
        category: 'organizations',
      },
      {
        name: 'Manage Organization Billing',
        slug: 'organizations.manage_billing',
        category: 'organizations',
      },
      {
        name: 'Manage Organization Security',
        slug: 'organizations.manage_security',
        category: 'organizations',
      },

      // Roles permissions
      { name: 'Manage Roles', slug: 'roles.manage', category: 'roles' },
      { name: 'View Roles', slug: 'roles.view', category: 'roles' },
      {
        name: 'Manage Team Roles',
        slug: 'team.manage_roles',
        category: 'roles',
      },

      // Reports permissions
      { name: 'View Reports', slug: 'reports.view', category: 'reports' },
      {
        name: 'View Team Reports',
        slug: 'reports.view_team',
        category: 'reports',
      },
    ];

    for (const permData of defaultPermissions) {
      // Check if permission already exists
      const existing = await this.db
        .select()
        .from(permissions)
        .where(eq(permissions.slug, permData.slug))
        .limit(1);

      if (existing.length === 0) {
        await this.db.insert(permissions).values({
          ...permData,
          isSystemPermission: true,
        });
      }
    }
  }

  async createDefaultRoles(organizationId: string): Promise<Role[]> {
    // First create default permissions if they don't exist
    await this.createDefaultPermissions();

    const defaultRoles = [
      {
        name: 'Admin',
        slug: 'admin',
        description: 'Full access to all organization features',
        color: '#EF4444',
        permissions: ['*'], // Wildcard for all permissions
        level: 'high' as const,
        isSystemRole: true,
      },
    ];

    const createdRoles: Role[] = [];

    for (const roleData of defaultRoles) {
      const [role] = await this.db
        .insert(roles)
        .values({
          organizationId,
          name: roleData.name,
          slug: roleData.slug,
          description: roleData.description,
          color: roleData.color,
          level: roleData.level,
          isSystemRole: roleData.isSystemRole,
        })
        .returning();

      // Assign permissions to the role
      for (const permissionSlug of roleData.permissions) {
        if (permissionSlug === '*') {
          // For admin role, assign all permissions
          const allPerms = await this.db.select().from(permissions);
          for (const perm of allPerms) {
            await this.assignPermissionToRole(role.id, perm.id, organizationId);
          }
        } else {
          // Find permission by slug and assign
          const [perm] = await this.db
            .select()
            .from(permissions)
            .where(eq(permissions.slug, permissionSlug))
            .limit(1);

          if (perm) {
            await this.assignPermissionToRole(role.id, perm.id, organizationId);
          }
        }
      }

      createdRoles.push(role);
    }

    return createdRoles;
  }

  async getAdminRole(organizationId: string): Promise<Role> {
    return this.findBySlug('admin', organizationId);
  }

  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
    organizationId: string,
  ): Promise<void> {
    // Verify role exists and belongs to organization
    await this.findOne(roleId, organizationId);

    // Verify permission exists
    const [permission] = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Check if assignment already exists
    const existing = await this.db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Permission already assigned to this role');
    }

    await this.db.insert(rolePermissions).values({
      roleId,
      permissionId,
    });
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
    organizationId: string,
  ): Promise<void> {
    // Verify role exists and belongs to organization
    await this.findOne(roleId, organizationId);

    const result = await this.db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Permission not assigned to this role');
    }
  }

  async getRolePermissions(
    roleId: string,
    organizationId: string,
  ): Promise<string[]> {
    // Verify role exists and belongs to organization
    await this.findOne(roleId, organizationId);

    const rolePerms = await this.db
      .select({
        slug: permissions.slug,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    return rolePerms.map((p) => p.slug);
  }

  async findAllWithPermissions(organizationId: string): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      color: string | null;
      level: string | null;
      isSystemRole: boolean;
      permissions: Array<{
        id: string;
        name: string;
        slug: string;
      }>;
    }>
  > {
    const allRoles = await this.findAll(organizationId);

    const rolesWithPerms = await Promise.all(
      allRoles.map(async (role) => {
        const rolePerms = await this.db
          .select({
            id: permissions.id,
            name: permissions.name,
            slug: permissions.slug,
          })
          .from(rolePermissions)
          .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id),
          )
          .where(eq(rolePermissions.roleId, role.id));

        return {
          id: role.id,
          name: role.name,
          slug: role.slug,
          description: role.description,
          color: role.color,
          level: role.level,
          isSystemRole: role.isSystemRole,
          permissions: rolePerms,
        };
      }),
    );

    return rolesWithPerms;
  }

  /**
   * Get single role with its permissions
   */
  async getRoleWithPermissions(
    roleId: string,
    organizationId: string,
  ): Promise<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    level: string | null;
    isSystemRole: boolean;
    permissions: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  }> {
    const role = await this.findOne(roleId, organizationId);

    const rolePerms = await this.db
      .select({
        id: permissions.id,
        name: permissions.name,
        slug: permissions.slug,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      color: role.color,
      level: role.level,
      isSystemRole: role.isSystemRole,
      permissions: rolePerms,
    };
  }

  /**
   * Assign multiple permissions to role (replaces existing)
   */
  async assignPermissionsToRole(
    roleId: string,
    organizationId: string,
    permissionIds: string[],
  ): Promise<void> {
    const role = await this.findOne(roleId, organizationId);

    // Cannot modify system roles
    if (role.isSystemRole) {
      throw new BadRequestException(
        'Cannot modify permissions for system roles',
      );
    }

    // Validate that at least 1 permission is provided
    if (permissionIds.length === 0) {
      throw new BadRequestException('Role must have at least 1 permission');
    }

    // Verify all permissions exist by checking count
    const foundPerms = await this.db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.id, permissionIds));

    if (foundPerms.length !== permissionIds.length) {
      throw new BadRequestException('One or more permissions not found');
    }

    // Delete existing permissions for this role
    await this.db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    // Insert new permissions
    const newAssignments = permissionIds.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    if (newAssignments.length > 0) {
      await this.db.insert(rolePermissions).values(newAssignments);
    }
  }
}
