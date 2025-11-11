import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  IsDateString,
} from 'class-validator';
import { TaskStatus, TaskPriority } from './create-task.dto';
import { Type } from 'class-transformer';

export class TaskFiltersDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search in title and description

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;
}
