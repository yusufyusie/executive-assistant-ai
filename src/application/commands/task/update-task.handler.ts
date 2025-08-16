/**
 * Update Task Handler - Application Layer
 * Handles task update commands
 */

import { Injectable, Inject } from '@nestjs/common';
import { CommandHandler } from '../../common/command.interface';
import { Result, success, failure } from '../../common/result';
import { UpdateTaskCommand } from './update-task.command';
import { TaskResponseDto } from '../../dtos/task.dto';
import type { TaskRepository } from '../../../domain/repositories/task.repository';
import {
  Priority,
  TaskStatus,
  Email,
} from '../../../domain/common/value-objects';

@Injectable()
export class UpdateTaskHandler
  implements CommandHandler<UpdateTaskCommand, Result<TaskResponseDto, string>>
{
  constructor(
    @Inject('TaskRepository') private readonly taskRepository: TaskRepository,
  ) {}

  async handle(
    command: UpdateTaskCommand,
  ): Promise<Result<TaskResponseDto, string>> {
    try {
      const { taskId, data } = command;

      // Find existing task
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return failure('Task not found');
      }

      // Update fields if provided
      if (data.title !== undefined) {
        if (!data.title.trim()) {
          return failure('Task title cannot be empty');
        }
        task.updateTitle(data.title.trim());
      }

      if (data.description !== undefined) {
        task.updateDescription(data.description?.trim());
      }

      if (data.priority !== undefined) {
        const priority = new Priority(data.priority);
        task.changePriority(priority);
      }

      if (data.status !== undefined) {
        const status = new TaskStatus(data.status);
        task.changeStatus(status);
      }

      if (data.assignee !== undefined) {
        if (data.assignee) {
          const assignee = new Email(data.assignee);
          task.assignTo(assignee);
        }
      }

      if (data.dueDate !== undefined) {
        if (data.dueDate) {
          const dueDate = new Date(data.dueDate);
          if (dueDate <= new Date()) {
            return failure('Due date must be in the future');
          }
          task.setDueDate(dueDate);
        }
      }

      if (data.estimatedDuration !== undefined) {
        if (data.estimatedDuration && data.estimatedDuration > 0) {
          task.setEstimatedDuration(data.estimatedDuration);
        }
      }

      if (data.tags !== undefined) {
        // Remove all existing tags and add new ones
        const currentTags = [...task.tags];
        currentTags.forEach((tag) => task.removeTag(tag));

        data.tags.forEach((tag) => {
          if (tag.trim()) {
            task.addTag(tag.trim());
          }
        });
      }

      if (data.dependencies !== undefined) {
        // Remove all existing dependencies and add new ones
        const currentDependencies = [...task.dependencies];
        currentDependencies.forEach((depId) => task.removeDependency(depId));

        data.dependencies.forEach((depId) => {
          if (depId.trim()) {
            task.addDependency(depId.trim());
          }
        });
      }

      // Save updated task
      await this.taskRepository.save(task);

      // Convert to DTO
      const responseDto = this.mapToResponseDto(task);

      return success(responseDto);
    } catch (error) {
      if (
        error.message.includes('Invalid') ||
        error.message.includes('cannot')
      ) {
        return failure(error.message);
      }
      return failure('Failed to update task');
    }
  }

  private mapToResponseDto(task: any): TaskResponseDto {
    const taskJson = task.toJSON();

    return {
      id: taskJson.id,
      title: taskJson.title,
      description: taskJson.description,
      status: taskJson.status,
      priority: taskJson.priority,
      assignee: taskJson.assignee,
      dueDate: taskJson.dueDate,
      tags: taskJson.tags,
      estimatedDuration: taskJson.estimatedDuration,
      dependencies: taskJson.dependencies,
      completedAt: taskJson.completedAt,
      isOverdue: taskJson.isOverdue,
      urgencyScore: taskJson.urgencyScore,
      createdAt: taskJson.createdAt,
      updatedAt: taskJson.updatedAt,
    };
  }
}
