import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GenerateSlugDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

export class GenerateSlugResponseDto {
  slug: string;
  isAvailable: boolean;
}
