import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateTaskDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assignedTo?: string[]; // Array of user IDs for multi-assignment

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedHours?: number;

  @IsOptional()
  @IsString()
  tags?: string; // JSON string of tag array
}
