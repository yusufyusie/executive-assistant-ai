/**
 * Create Task Handler - Application Layer
 * Handles task creation commands
 */

import { Injectable, Inject } from '@nestjs/common';
import { CommandHandler } from '../../common/command.interface';
import { Result, success, failure } from '../../common/result';
import { CreateTaskCommand } from './create-task.command';
import { TaskResponseDto } from '../../dtos/task.dto';
import { Task } from '../../../domain/entities/task.entity';
import type { TaskRepository } from '../../../domain/repositories/task.repository';
// Value objects are created internally by Task.create

@Injectable()
export class CreateTaskHandler implements CommandHandler<CreateTaskCommand, Result<TaskResponseDto, string>> {
  constructor(@Inject('TaskRepository') private readonly taskRepository: TaskRepository) {}

  async handle(command: CreateTaskCommand): Promise<Result<TaskResponseDto, string>> {
    try {
      const { data } = command;

      // Validate required fields
      if (!data.title?.trim()) {
        return failure('Task title is required');
      }

      // Create value objects
      const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;

      // Validate due date
      if (dueDate && dueDate <= new Date()) {
        return failure('Due date must be in the future');
      }

      // Create task entity
      const task = Task.create({
        title: data.title.trim(),
        description: data.description?.trim(),
        priority: data.priority || 'medium',
        assignee: data.assignee,
        dueDate,
        tags: data.tags || [],
        estimatedDuration: data.estimatedDuration,
        dependencies: data.dependencies || [],
      });

      // Save to repository
      await this.taskRepository.save(task);

      // Convert to DTO
      const responseDto = this.mapToResponseDto(task);

      return success(responseDto);
    } catch (error) {
      if (error.message.includes('Invalid')) {
        return failure(error.message);
      }
      return failure('Failed to create task');
    }
  }

  private mapToResponseDto(task: Task): TaskResponseDto {
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
