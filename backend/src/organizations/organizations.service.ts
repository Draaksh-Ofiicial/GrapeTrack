import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { type Database, DATABASE } from '../database/database.module';
import {
  organizations,
  users,
  userOrganizations,
  roles,
  permissions,
  rolePermissions,
  organizationDeletionTokens,
  type Organization,
  type UserOrganization,
  Permission,
} from '../database/schema';
import { RolesService } from '../roles/roles.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationWithRoleDto } from './dto/organization-with-role.dto';
import {
  AddUserToOrganizationDto,
  UpdateMemberRoleDto,
  UpdateMemberStatusDto,
  MemberStatus,
} from './dto/member.dto';
import {
  InitiateDeleteOrganizationDto,
  ConfirmDeleteOrganizationDto,
} from './dto/delete-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly rolesService: RolesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    dto: CreateOrganizationDto,
    creatorUserId: string,
  ): Promise<Organization> {
    // Check if slug is already taken
    const existing = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, dto.slug))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Organization slug already exists');
    }

    // Create organization
    const [organization] = await this.db
      .insert(organizations)
      .values({
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        logo: dto.logo,
        website: dto.website,
        plan: dto.plan || 'free',
        maxUsers: dto.maxUsers || '5',
        createdBy: creatorUserId,
      })
      .returning();

    // Create default roles and add creator as admin role
    await this.rolesService.createDefaultRoles(organization.id);
    const adminRole = await this.rolesService.getAdminRole(organization.id);
    await this.db.insert(userOrganizations).values({
      userId: creatorUserId,
      organizationId: organization.id,
      roleId: adminRole.id,
      status: 'active',
      joinedAt: new Date(),
    });

    return organization;
  }

  async findAll(): Promise<Organization[]> {
    return this.db.select().from(organizations);
  }

  async findOne(id: string): Promise<Organization> {
    const [organization] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Find organization by ID with current user's role
   */
  async findOneWithUserRole(
    id: string,
    userId: string,
  ): Promise<OrganizationWithRoleDto> {
    // Get organization
    const organization = await this.findOne(id);

    // Get user's role in this organization
    const [userOrg] = await this.db
      .select({
        roleId: userOrganizations.roleId,
        roleName: roles.name,
        roleSlug: roles.slug,
      })
      .from(userOrganizations)
      .innerJoin(roles, eq(userOrganizations.roleId, roles.id))
      .where(
        and(
          eq(userOrganizations.organizationId, id),
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.status, 'active'),
        ),
      )
      .limit(1);

    if (!userOrg) {
      throw new NotFoundException('User is not a member of this organization');
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description || undefined,
      logo: organization.logo || undefined,
      website: organization.website || undefined,
      plan: organization.plan,
      maxUsers: organization.maxUsers || '5',
      createdBy: organization.createdBy,
      isActive: organization.isActive,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
      userRole: {
        id: userOrg.roleId,
        name: userOrg.roleName,
        slug: userOrg.roleSlug,
      },
    };
  }

  async findBySlug(slug: string): Promise<Organization> {
    const [organization] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Generate a unique slug from organization name
   * Converts to lowercase, replaces spaces/special chars with hyphens,
   * removes consecutive hyphens, and ensures uniqueness
   */
  async generateSlug(
    name: string,
  ): Promise<{ slug: string; isAvailable: boolean }> {
    // Convert to lowercase and replace spaces/special chars with hyphens
    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // Ensure minimum length
    if (slug.length === 0) {
      slug = 'organization';
    }

    // Check if the base slug is available
    const existing = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (existing.length === 0) {
      return { slug, isAvailable: true };
    }

    // If not available, add a number suffix
    let counter = 1;
    let uniqueSlug = `${slug}-${counter}`;

    while (true) {
      const existingWithSuffix = await this.db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, uniqueSlug))
        .limit(1);

      if (existingWithSuffix.length === 0) {
        return { slug: uniqueSlug, isAvailable: true };
      }

      counter++;
      uniqueSlug = `${slug}-${counter}`;

      // Prevent infinite loop (max 10 attempts)
      if (counter > 10) {
        // Fallback: use timestamp
        uniqueSlug = `${slug}-${Date.now()}`;
        break;
      }
    }

    return { slug: uniqueSlug, isAvailable: true };
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(id);

    // If slug is being updated, check for conflicts
    if (dto.slug && dto.slug !== organization.slug) {
      const existing = await this.db
        .select()
        .from(organizations)

        .where(eq(organizations.slug, dto.slug))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException('Organization slug already exists');
      }
    }

    const [updated] = await this.db
      .update(organizations)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    // Soft delete
    await this.db
      .update(organizations)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(eq(organizations.id, id));
  }

  // Many-to-many relationship methods

  async addUserToOrganization(
    organizationId: string,
    dto: AddUserToOrganizationDto,
    invitedByUserId: string,
  ): Promise<UserOrganization> {
    // Verify organization exists
    await this.findOne(organizationId);

    // Verify user exists
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, dto.userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if relationship already exists
    const existing = await this.db
      .select()
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, dto.userId),
          eq(userOrganizations.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(
        'User is already a member of this organization',
      );
    }

    // Validate roleId belongs to this organization
    const [role] = await this.db
      .select()
      .from(roles)
      .where(
        and(eq(roles.id, dto.roleId), eq(roles.organizationId, organizationId)),
      )
      .limit(1);

    if (!role) {
      throw new NotFoundException('Role not found for this organization');
    }

    // Add user to organization
    const [relationship] = await this.db
      .insert(userOrganizations)
      .values({
        userId: dto.userId,
        organizationId: organizationId,
        roleId: dto.roleId,
        status: dto.status || 'active',
        joinedAt:
          (dto.status || 'active') === MemberStatus.ACTIVE ? new Date() : null,
      })
      .returning();

    // Send welcome email to the new member
    const inviterUser = await this.db
      .select()
      .from(users)
      .where(eq(users.id, invitedByUserId))
      .limit(1);

    if (inviterUser.length > 0) {
      const org = await this.findOne(organizationId);

      try {
        await this.notificationsService.sendWelcomeEmail(
          user.email,
          user.firstName,
          org.name,
        );
      } catch (error) {
        console.error(
          'Failed to send welcome email:',
          (error as Error).message,
        );
        // Don't throw - user was added successfully, just email failed
      }
    }

    return relationship;
  }

  async removeUserFromOrganization(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.db
      .delete(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, organizationId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('User is not a member of this organization');
    }
  }

  async getOrganizationMembers(organizationId: string) {
    await this.findOne(organizationId);

    const members = await this.db
      .select({
        userId: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar,
        roleId: userOrganizations.roleId,
        roleName: roles.name,
        roleSlug: roles.slug,
        status: userOrganizations.status,
        joinedAt: userOrganizations.joinedAt,
      })
      .from(userOrganizations)
      .innerJoin(users, eq(userOrganizations.userId, users.id))
      .leftJoin(roles, eq(userOrganizations.roleId, roles.id))
      .where(eq(userOrganizations.organizationId, organizationId));

    return members;
  }

  async getUserOrganizations(userId: string) {
    const userOrgs = await this.db
      .select({
        organizationId: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        plan: organizations.plan,
        createdBy: organizations.createdBy,
        roleId: userOrganizations.roleId,
        roleName: roles.name,
        status: userOrganizations.status,
        joinedAt: userOrganizations.joinedAt,
      })
      .from(userOrganizations)
      .innerJoin(
        organizations,
        eq(userOrganizations.organizationId, organizations.id),
      )
      .leftJoin(roles, eq(userOrganizations.roleId, roles.id))
      .where(eq(userOrganizations.userId, userId));

    return userOrgs;
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<UserOrganization> {
    // Validate role belongs to organization
    const [role] = await this.db
      .select()
      .from(roles)
      .where(
        and(eq(roles.id, dto.roleId), eq(roles.organizationId, organizationId)),
      )
      .limit(1);

    if (!role) {
      throw new NotFoundException('Role not found for this organization');
    }

    const [updated] = await this.db
      .update(userOrganizations)
      .set({
        roleId: dto.roleId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, organizationId),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundException('User is not a member of this organization');
    }

    return updated;
  }

  async updateMemberStatus(
    organizationId: string,
    userId: string,
    dto: UpdateMemberStatusDto,
  ): Promise<UserOrganization> {
    const [updated] = await this.db
      .update(userOrganizations)
      .set({
        status: dto.status,
        joinedAt: dto.status === MemberStatus.ACTIVE ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, organizationId),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundException('User is not a member of this organization');
    }

    return updated;
  }

  async getMemberRole(
    organizationId: string,
    userId: string,
  ): Promise<{
    roleId: string;
    roleName: string | null;
    roleSlug: string | null;
    permissions: string[] | null;
  } | null> {
    // First get the role info
    const [member] = await this.db
      .select({
        roleId: userOrganizations.roleId,
        roleName: roles.name,
        roleSlug: roles.slug,
      })
      .from(userOrganizations)
      .leftJoin(roles, eq(userOrganizations.roleId, roles.id))
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!member || !member.roleId) {
      return null;
    }

    // Then get the permissions for this role
    const rolePerms = await this.db
      .select({
        slug: permissions.slug,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, member.roleId));

    const permissionSlugs = rolePerms.map((p) => p.slug);

    return {
      ...member,
      permissions: permissionSlugs.length > 0 ? permissionSlugs : null,
    };
  }

  /**
   * Initiate organization deletion
   * Validates confirmation text and sends email confirmation
   */
  async initiateDeleteOrganization(
    userId: string,
    currentOrgId: string | undefined,
    dto: InitiateDeleteOrganizationDto,
  ): Promise<{ message: string }> {
    // Get organization details
    const org = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, dto.organizationId))
      .limit(1);

    if (org.length === 0) {
      throw new NotFoundException('Organization not found');
    }

    const organization = org[0];

    // Check if user is admin of this organization
    const userRoleInfo = await this.db
      .select({
        roleName: roles.name,
      })
      .from(userOrganizations)
      .innerJoin(roles, eq(userOrganizations.roleId, roles.id))
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, dto.organizationId),
        ),
      )
      .limit(1);

    if (userRoleInfo.length === 0) {
      throw new NotFoundException('You are not a member of this organization');
    }

    if (userRoleInfo[0].roleName.toLowerCase() !== 'admin') {
      throw new ConflictException(
        'Only organization admins can delete organizations',
      );
    }

    // Prevent deleting current organization
    if (currentOrgId && dto.organizationId === currentOrgId) {
      throw new ConflictException(
        'Cannot delete your current organization. Please switch to another organization first.',
      );
    }

    // Validate confirmation text
    const expectedText = `delete my ${organization.name} organization`;
    if (dto.confirmationText.toLowerCase() !== expectedText.toLowerCase()) {
      throw new ConflictException(
        `Confirmation text must be: "${expectedText}"`,
      );
    }

    // Generate deletion token (valid for 24 hours)
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store deletion token in database
    await this.db.insert(organizationDeletionTokens).values({
      organizationId: dto.organizationId,
      userId,
      token,
      expiresAt,
    });

    // Send confirmation email
    await this.notificationsService.sendOrganizationDeletionConfirmation(
      organization,
      userId,
      token,
    );

    return {
      message:
        'Organization deletion initiated. Please check your email to confirm.',
    };
  }

  /**
   * Confirm organization deletion
   * Validates token and permanently deletes organization
   */
  async confirmDeleteOrganization(
    userId: string,
    currentOrgId: string | undefined,
    dto: ConfirmDeleteOrganizationDto,
  ): Promise<{ message: string }> {
    // Get organization details
    const org = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, dto.organizationId))
      .limit(1);

    if (org.length === 0) {
      throw new NotFoundException('Organization not found');
    }

    const organization = org[0];

    // Check if user is admin of this organization
    const userRoleInfo = await this.db
      .select({
        roleName: roles.name,
      })
      .from(userOrganizations)
      .innerJoin(roles, eq(userOrganizations.roleId, roles.id))
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, dto.organizationId),
        ),
      )
      .limit(1);

    if (userRoleInfo.length === 0) {
      throw new NotFoundException('You are not a member of this organization');
    }

    if (userRoleInfo[0].roleName !== 'Admin') {
      throw new ConflictException(
        'Only organization admins can delete organizations',
      );
    }

    // Prevent deleting current organization
    if (currentOrgId && dto.organizationId === currentOrgId) {
      throw new ConflictException(
        'Cannot delete your current organization. Please switch to another organization first.',
      );
    }

    // Validate deletion token
    const [deletionToken] = await this.db
      .select()
      .from(organizationDeletionTokens)
      .where(
        and(
          eq(organizationDeletionTokens.organizationId, dto.organizationId),
          eq(organizationDeletionTokens.userId, userId),
          eq(organizationDeletionTokens.token, dto.token),
        ),
      )
      .limit(1);

    if (!deletionToken) {
      throw new NotFoundException('Invalid or expired deletion token');
    }

    if (deletionToken.expiresAt < new Date()) {
      throw new ConflictException('Deletion token has expired');
    }

    if (deletionToken.usedAt) {
      throw new ConflictException('Deletion token has already been used');
    }

    // Mark token as used
    await this.db
      .update(organizationDeletionTokens)
      .set({
        usedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizationDeletionTokens.id, deletionToken.id));

    // Start transaction for safe deletion
    await this.db.transaction(async (tx) => {
      // Delete all user-organization relationships
      await tx
        .delete(userOrganizations)
        .where(eq(userOrganizations.organizationId, dto.organizationId));

      // Delete all roles and their permissions for this organization
      const orgRoles = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.organizationId, dto.organizationId));

      for (const role of orgRoles) {
        await tx
          .delete(rolePermissions)
          .where(eq(rolePermissions.roleId, role.id));
      }

      await tx
        .delete(roles)
        .where(eq(roles.organizationId, dto.organizationId));

      // Finally, delete the organization
      await tx
        .delete(organizations)
        .where(eq(organizations.id, dto.organizationId));
    });

    return {
      message: `Organization "${organization.name}" has been permanently deleted.`,
    };
  }

  /**
   * Get user's permissions in an organization
   * Fetches the user's role and all permissions assigned to that role
   * Used for permission-based menu and UI rendering on frontend
   */
  async getUserPermissionsInOrganization(
    organizationId: string,
    userId: string,
  ): Promise<{ permissions: Permission[] }> {
    // Get user's role in the organization
    const userOrg = await this.db
      .select({
        roleId: userOrganizations.roleId,
      })
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.organizationId, organizationId),
          eq(userOrganizations.userId, userId),
        ),
      )
      .limit(1);

    if (!userOrg || userOrg.length === 0) {
      return { permissions: [] };
    }

    // Get all permissions for this role
    const rolePerms = await this.db
      .select({
        id: permissions.id,
        name: permissions.name,
        description: permissions.description,
        slug: permissions.slug,
        category: permissions.category,
        isSystemPermission: permissions.isSystemPermission,
        createdAt: permissions.createdAt,
        updatedAt: permissions.updatedAt,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, userOrg[0].roleId));

    return { permissions: rolePerms };
  }

  /**
   * Get all available permissions for the organization
   * Used to populate permission matrix in role management UI
   */
  async getOrganizationPermissions() {
    return this.db
      .select({
        id: permissions.id,
        name: permissions.name,
        slug: permissions.slug,
        category: permissions.category,
      })
      .from(permissions)
      .orderBy(permissions.category, permissions.name);
  }
}
