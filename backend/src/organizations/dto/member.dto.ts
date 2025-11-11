import { IsUUID, IsEnum, IsOptional, IsEmail } from 'class-validator';

export enum MemberStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export class AddUserToOrganizationDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  roleId: string; // Dynamic role ID from roles table

  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;
}

export class InviteUserToOrganizationDto {
  @IsEmail()
  email: string;

  @IsUUID()
  roleId: string; // Dynamic role ID from roles table
}

export class UpdateMemberRoleDto {
  @IsUUID()
  roleId: string; // Dynamic role ID from roles table
}

export class UpdateMemberStatusDto {
  @IsEnum(MemberStatus)
  status: MemberStatus;
}
