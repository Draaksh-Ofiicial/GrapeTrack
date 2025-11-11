import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export enum RoleLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsEnum(RoleLevel)
  level: RoleLevel;

  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;
}
