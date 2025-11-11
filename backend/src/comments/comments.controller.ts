import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../database/schema';

@Controller('organizations/:orgId/tasks/:taskId/comments')
@UseGuards(JwtAuthGuard, OrganizationGuard, PermissionsGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @Permissions('tasks.comment')
  create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      orgId,
      taskId,
      user.id,
      createCommentDto,
    );
  }

  @Get()
  @Permissions('tasks.view')
  findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.commentsService.findAll(orgId, taskId);
  }

  @Get(':commentId')
  @Permissions('tasks.view')
  findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.commentsService.findOne(orgId, taskId, commentId);
  }

  @Put(':commentId')
  @Permissions('tasks.comment')
  update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: User,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(
      orgId,
      taskId,
      commentId,
      user.id,
      updateCommentDto,
    );
  }

  @Delete(':commentId')
  @Permissions('tasks.comment')
  remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.remove(orgId, taskId, commentId, user.id);
  }
}
