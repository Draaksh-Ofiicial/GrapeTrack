import { IsArray, IsUUID, ValidateIf } from 'class-validator';

export class AssignTaskDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ValidateIf((o) => Array.isArray(o.assignedTo))
  assignedTo: string[]; // Array of user IDs for multi-assignment
}
