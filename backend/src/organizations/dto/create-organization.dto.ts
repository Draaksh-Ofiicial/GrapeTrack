/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  IsString,
  IsOptional,
  IsUrl,
  IsEnum,
  MaxLength,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';

export enum OrganizationPlan {
  FREE = 'free',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @ValidateIf((o) => o.logo !== undefined && o.logo !== '')
  @IsUrl()
  logo?: string;

  @IsOptional()
  @ValidateIf((o) => o.website !== undefined && o.website !== '')
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsEnum(OrganizationPlan)
  plan?: OrganizationPlan;

  @IsOptional()
  @IsString()
  maxUsers?: string;
}
