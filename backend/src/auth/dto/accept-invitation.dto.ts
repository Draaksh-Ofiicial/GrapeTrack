import { IsString, IsOptional, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string; // Only required for new users

  @IsOptional()
  @IsString()
  firstName?: string; // Only required for new users

  @IsOptional()
  @IsString()
  lastName?: string; // Only required for new users
}
