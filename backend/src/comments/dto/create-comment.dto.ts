import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(2000, { message: 'Comment content cannot exceed 2000 characters' })
  content: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(2000, { message: 'Comment content cannot exceed 2000 characters' })
  content: string;
}
