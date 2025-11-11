import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  taskAssignedEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  taskCompletedEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  deadlineReminderEmail?: boolean;
}
