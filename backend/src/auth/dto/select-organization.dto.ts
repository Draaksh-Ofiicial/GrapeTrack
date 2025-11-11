import { IsUUID } from 'class-validator';

export class SelectOrganizationDto {
  @IsUUID('4')
  organizationId: string;
}
