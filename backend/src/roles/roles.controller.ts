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
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard, OrganizationGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';

@Controller('organizations/:orgId/roles')
@UseGuards(JwtAuthGuard, OrganizationGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * GET /organizations/:orgId/roles
   * List all roles in organization (with permissions)
   * Accessible to all authenticated members
   */
  @Get()
  async findAll(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return await this.rolesService.findAllWithPermissions(orgId);
  }

  /**
   * GET /organizations/:orgId/roles/:roleId
   * Get role details with permissions
   */
  @Get(':roleId')
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return await this.rolesService.getRoleWithPermissions(roleId, orgId);
  }

  /**
   * POST /organizations/:orgId/roles
   * Create custom role (admin only)
   * Cannot create system roles
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin')
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    return this.rolesService.create(orgId, createRoleDto);
  }

  /**
   * PATCH /organizations/:orgId/roles/:roleId
   * Update custom role (admin only)
   * Cannot update system roles
   */
  @Patch(':roleId')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(roleId, orgId, updateRoleDto);
  }

  /**
   * DELETE /organizations/:orgId/roles/:roleId
   * Delete custom role (admin only)
   * Cannot delete system roles or roles assigned to members
   */
  @Delete(':roleId')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    await this.rolesService.remove(roleId, orgId);
    return { message: 'Role deleted successfully' };
  }

  /**
   * POST /organizations/:orgId/roles/:roleId/permissions
   * Assign permissions to role (admin only)
   * Replaces existing permissions
   */
  @Post(':roleId/permissions')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  async assignPermissions(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body('permissionIds') permissionIds: string[],
  ) {
    await this.rolesService.assignPermissionsToRole(
      roleId,
      orgId,
      permissionIds,
    );
    return { message: 'Permissions assigned successfully' };
  }

  /**
   * DELETE /organizations/:orgId/roles/:roleId/permissions/:permissionId
   * Remove permission from role (admin only)
   * Validates that at least 1 permission remains
   */
  @Delete(':roleId/permissions/:permissionId')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  async removePermission(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    await this.rolesService.removePermissionFromRole(
      roleId,
      orgId,
      permissionId,
    );
    return { message: 'Permission removed successfully' };
  }
}
