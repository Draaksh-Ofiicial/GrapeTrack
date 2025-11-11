import { Controller, UseGuards, Get, Patch, Body, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../database/schema';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Controller('organizations/:orgId/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get notification preferences for the current user in the organization
   */
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @Get('preferences')
  async getPreferences(
    @CurrentUser() user: User,
    @Param('orgId') organizationId: string,
  ) {
    return this.notificationsService.getPreferences(user.id, organizationId);
  }

  /**
   * Update notification preferences for the current user in the organization
   */
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() user: User,
    @Param('orgId') organizationId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(
      user.id,
      organizationId,
      dto,
    );
  }
}
