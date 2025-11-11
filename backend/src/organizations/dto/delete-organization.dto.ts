import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class InitiateDeleteOrganizationDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  confirmationText: string;
}

export class ConfirmDeleteOrganizationDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
