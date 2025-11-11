import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationInvitesService } from './organization-invites.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { GenerateSlugDto } from './dto/generate-slug.dto';
import { OrganizationWithRoleDto } from './dto/organization-with-role.dto';
import {
  AddUserToOrganizationDto,
  InviteUserToOrganizationDto,
  UpdateMemberRoleDto,
  UpdateMemberStatusDto,
} from './dto/member.dto';
import {
  InitiateDeleteOrganizationDto,
  ConfirmDeleteOrganizationDto,
} from './dto/delete-organization.dto';
import { JwtAuthGuard, OrganizationGuard, RolesGuard } from '../auth/guards';
import { CurrentUser, CurrentOrg, Roles } from '../auth/decorators';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    @Inject(OrganizationInvitesService)
    private readonly organizationInvitesService: OrganizationInvitesService,
  ) {}

  /**
   * POST /organizations
   * Create a new organization (creator becomes admin)
   * Any authenticated user can create (1 org per user limit enforced in service)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(createOrganizationDto, user.id);
  }

  /**
   * POST /organizations/generate-slug
   * Generate a unique slug from organization name
   * Public endpoint - no authentication required
   */
  @Post('generate-slug')
  generateSlug(@Body() generateSlugDto: GenerateSlugDto) {
    return this.organizationsService.generateSlug(generateSlugDto.name);
  }

  /**
   * GET /organizations
   * List all organizations (public endpoint)
   */
  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  /**
   * GET /organizations/:id
   * Get organization details with current user's role
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrganizationWithRoleDto> {
    return this.organizationsService.findOneWithUserRole(id, user.id);
  }

  /**
   * GET /organizations/slug/:slug
   * Get organization by slug
   */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  /**
   * PATCH /organizations/:id
   * Update organization (admin only)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  /**
   * DELETE /organizations/:id
   * Delete organization (admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.remove(id);
  }

  // ============ Member Management Endpoints ============

  /**
   * POST /organizations/:id/members
   * Add existing user to organization (admin only)
   * Can invite existing users directly or new users via email
   */
  @Post(':id/members')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() addUserDto: AddUserToOrganizationDto,
  ) {
    return this.organizationsService.addUserToOrganization(
      id,
      addUserDto,
      user.id,
    );
  }

  /**
   * POST /organizations/:id/invite
   * Invite a user to join organization by email (admin only)
   * User account will be created if they don't exist
   */
  @Post(':id/invite')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  inviteMember(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() inviteUserDto: InviteUserToOrganizationDto,
  ) {
    return this.organizationInvitesService.inviteUserToOrganization(
      id,
      inviteUserDto.email,
      user.id,
      inviteUserDto.roleId,
    );
  }

  /**
   * POST /organizations/:orgId/users/invite
   * Send email invitation to a user to join the organization
   * Admin only - creates an invitation token and sends email
   */
  @Post(':orgId/users/invite')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  inviteUser(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteUserToOrganizationDto,
  ) {
    return this.organizationInvitesService.inviteUserToOrganization(
      orgId,
      dto.email,
      user.id,
      dto.roleId,
    );
  }

  /**
   * GET /organizations/:id/members
   * List organization members (all members can view)
   */
  @Get(':id/members')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.getOrganizationMembers(id);
  }

  /**
   * DELETE /organizations/:id/members/:userId
   * Remove user from organization (admin only)
   */
  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.organizationsService.removeUserFromOrganization(id, userId);
  }

  /**
   * PATCH /organizations/:id/members/:userId/role
   * Update member's role (admin only)
   */
  @Patch(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ) {
    return this.organizationsService.updateMemberRole(
      id,
      userId,
      updateRoleDto,
    );
  }

  /**
   * PATCH /organizations/:id/members/:userId/status
   * Update member's status (admin only)
   */
  @Patch(':id/members/:userId/status')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  updateMemberStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateStatusDto: UpdateMemberStatusDto,
  ) {
    return this.organizationsService.updateMemberStatus(
      id,
      userId,
      updateStatusDto,
    );
  }

  /**
   * GET /organizations/:id/members/:userId/role
   * Get member's role (all members can view)
   */
  @Get(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  getMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.organizationsService.getMemberRole(id, userId);
  }

  /**
   * GET /organizations/:id/permissions
   * Get current user's permissions in the organization
   * Used by frontend for permission-based menu/UI rendering
   */
  @Get(':id/permissions')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  getUserPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.getUserPermissionsInOrganization(
      id,
      user.id,
    );
  }

  /**
   * POST /organizations/:id/delete/initiate
   * Initiate organization deletion (admin only)
   * Requires typing confirmation text and sends email
   */
  @Post(':id/delete/initiate')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  initiateDelete(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrg() currentOrg: AuthenticatedUser['currentOrganization'],
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InitiateDeleteOrganizationDto,
  ) {
    return this.organizationsService.initiateDeleteOrganization(
      user.id,
      currentOrg?.id,
      {
        ...dto,
        organizationId: id,
      },
    );
  }

  /**
   * POST /organizations/:id/delete/confirm
   * Confirm organization deletion via email token (admin only)
   */
  @Post(':id/delete/confirm')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  confirmDelete(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrg() currentOrg: AuthenticatedUser['currentOrganization'],
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmDeleteOrganizationDto,
  ) {
    return this.organizationsService.confirmDeleteOrganization(
      user.id,
      currentOrg?.id,
      {
        ...dto,
        organizationId: id,
      },
    );
  }

  /**
   * GET /organizations/:orgId/permissions
   * List all available permissions for the organization
   * Used by role management UI for permission matrix
   * Accessible to all authenticated members
   */
  @Get(':orgId/permissions')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPermissions(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.organizationsService.getOrganizationPermissions();
  }

  /**
   * GET /organizations/:id/invitations/pending
   * Get all pending invitations for the organization (admin only)
   */
  @Get(':id/invitations/pending')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  getPendingInvitations(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationInvitesService.getPendingInvitations(id);
  }

  /**
   * POST /organizations/:id/invitations/:invitationId/resend
   * Resend an invitation email (admin only)
   */
  @Post(':id/invitations/:invitationId/resend')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  resendInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.organizationInvitesService.resendInvitation(invitationId);
  }

  /**
   * DELETE /organizations/:id/invitations/:invitationId
   * Revoke an invitation (admin only)
   */
  @Delete(':id/invitations/:invitationId')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles('Admin')
  revokeInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.organizationInvitesService.revokeInvitation(invitationId);
  }
}
