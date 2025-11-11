import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TaskStatus } from './create-task.dto';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Completion notes cannot be empty' })
  completionNotes?: string;
}
