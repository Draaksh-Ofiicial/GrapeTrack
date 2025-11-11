import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationInvitesService } from './organization-invites.service';
import { OrganizationsController } from './organizations.controller';
import { RolesModule } from '../roles/roles.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [RolesModule, DatabaseModule, NotificationsModule, UsersModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationInvitesService],
  exports: [OrganizationsService, OrganizationInvitesService],
})
export class OrganizationsModule {}
