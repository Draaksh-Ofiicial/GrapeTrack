import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { type Database, DATABASE } from '../database/database.module';
import {
  comments,
  Comment,
  NewComment,
} from '../database/schema/comments.schema';
import { tasks } from '../database/schema/tasks.schema';
import { CreateCommentDto, UpdateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    organizationId: string,
    taskId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    // Verify task exists and belongs to organization
    const task = await this.db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)),
      )
      .limit(1);

    if (!task.length) {
      throw new NotFoundException('Task not found');
    }

    const newComment: NewComment = {
      organizationId,
      taskId,
      userId,
      content: dto.content,
    };

    const result = await this.db
      .insert(comments)
      .values(newComment)
      .returning();

    return result[0];
  }

  async findAll(organizationId: string, taskId: string): Promise<Comment[]> {
    // Verify task exists and belongs to organization
    const task = await this.db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)),
      )
      .limit(1);

    if (!task.length) {
      throw new NotFoundException('Task not found');
    }

    return this.db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.taskId, taskId),
          eq(comments.organizationId, organizationId),
        ),
      )
      .orderBy(desc(comments.createdAt));
  }

  async findOne(
    organizationId: string,
    taskId: string,
    commentId: string,
  ): Promise<Comment> {
    const result = await this.db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.taskId, taskId),
          eq(comments.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!result.length) {
      throw new NotFoundException('Comment not found');
    }

    return result[0];
  }

  async update(
    organizationId: string,
    taskId: string,
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    // First check if comment exists and user owns it
    const comment = await this.findOne(organizationId, taskId, commentId);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const result = await this.db
      .update(comments)
      .set({
        content: dto.content,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning();

    return result[0];
  }

  async remove(
    organizationId: string,
    taskId: string,
    commentId: string,
    userId: string,
  ): Promise<void> {
    // First check if comment exists and user owns it
    const comment = await this.findOne(organizationId, taskId, commentId);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.db.delete(comments).where(eq(comments.id, commentId));
  }
}
