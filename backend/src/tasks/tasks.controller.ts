import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFiltersDto,
  AssignTaskDto,
  UpdateTaskStatusDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../database/schema';

@Controller('organizations/:orgId/tasks')
@UseGuards(JwtAuthGuard, OrganizationGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Permissions('tasks.create')
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return this.tasksService.create(createTaskDto, orgId, user.id);
  }

  @Get()
  @Permissions('tasks.view')
  findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() filters: TaskFiltersDto,
  ) {
    return this.tasksService.findAll(orgId, filters);
  }

  @Get(':id')
  @Permissions('tasks.view')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return this.tasksService.findOne(id, orgId);
  }

  @Patch(':id')
  @Permissions('tasks.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return this.tasksService.update(id, updateTaskDto, orgId, user.id);
  }

  @Patch(':id/assign')
  @Permissions('tasks.assign')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignTaskDto: AssignTaskDto,
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return this.tasksService.assign(id, assignTaskDto, orgId, user.id);
  }

  @Patch(':id/status')
  @Permissions('tasks.update')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return this.tasksService.updateStatus(
      id,
      updateTaskStatusDto,
      orgId,
      user.id,
    );
  }

  @Delete(':id')
  @Permissions('tasks.delete')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return this.tasksService.remove(id, orgId, user.id);
  }

  @Get(':id/activity')
  @Permissions('tasks.view')
  getActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return this.tasksService.getActivity(id, orgId);
  }
}
