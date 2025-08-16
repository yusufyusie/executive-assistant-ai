/**
 * Task Application Service - Application Layer
 * Orchestrates task-related use cases
 */

import { Injectable, Inject } from '@nestjs/common';
import { CreateTaskHandler } from '../commands/task/create-task.handler';
import { UpdateTaskHandler } from '../commands/task/update-task.handler';
import { GetTasksHandler } from '../queries/task/get-tasks.handler';
import { CreateTaskCommand } from '../commands/task/create-task.command';
import { UpdateTaskCommand } from '../commands/task/update-task.command';
import { GetTasksQuery } from '../queries/task/get-tasks.query';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  TaskResponseDto,
  TaskListResponseDto,
  PrioritizeTasksDto,
  TaskPrioritizationResponseDto,
  TaskAnalyticsResponseDto,
} from '../dtos/task.dto';
import { Result } from '../common/result';
import type { TaskRepository } from '../../domain/repositories/task.repository';
import { TaskPrioritizationService } from '../../domain/services/task-prioritization.service';
import { Priority, TaskStatus } from '../../domain/common/value-objects';

@Injectable()
export class TaskApplicationService {
  constructor(
    private readonly createTaskHandler: CreateTaskHandler,
    private readonly updateTaskHandler: UpdateTaskHandler,
    private readonly getTasksHandler: GetTasksHandler,
    @Inject('TaskRepository') private readonly taskRepository: TaskRepository,
    private readonly taskPrioritizationService: TaskPrioritizationService,
  ) {}

  async createTask(
    data: CreateTaskDto,
  ): Promise<Result<TaskResponseDto, string>> {
    const command = new CreateTaskCommand(data);
    return this.createTaskHandler.handle(command);
  }

  async updateTask(
    taskId: string,
    data: UpdateTaskDto,
  ): Promise<Result<TaskResponseDto, string>> {
    const command = new UpdateTaskCommand(taskId, data);
    return this.updateTaskHandler.handle(command);
  }

  async getTasks(
    options?: TaskQueryDto,
  ): Promise<Result<TaskListResponseDto, string>> {
    const query = new GetTasksQuery(options);
    return this.getTasksHandler.handle(query);
  }

  async getTaskById(taskId: string): Promise<Result<TaskResponseDto, string>> {
    try {
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return Result.failure('Task not found');
      }

      const responseDto = this.mapToResponseDto(task);
      return Result.success(responseDto);
    } catch (error) {
      return Result.failure('Failed to retrieve task');
    }
  }

  async deleteTask(taskId: string): Promise<Result<void, string>> {
    try {
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return Result.failure('Task not found');
      }

      await this.taskRepository.delete(taskId);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure('Failed to delete task');
    }
  }

  async prioritizeTasks(
    data: PrioritizeTasksDto,
  ): Promise<Result<TaskPrioritizationResponseDto, string>> {
    try {
      let tasks;

      if (data.taskIds && data.taskIds.length > 0) {
        // Get specific tasks
        tasks = [];
        for (const taskId of data.taskIds) {
          const task = await this.taskRepository.findById(taskId);
          if (task) {
            tasks.push(task);
          }
        }
      } else {
        // Get all active tasks
        const result = await this.taskRepository.findMany({
          filters: {
            status: undefined, // Get all statuses except completed/cancelled
          },
        });
        tasks = result.items.filter(
          (task) =>
            task.status.value !== 'completed' &&
            task.status.value !== 'cancelled',
        );
      }

      if (tasks.length === 0) {
        return Result.failure('No tasks found for prioritization');
      }

      // Perform prioritization
      const prioritizationResult =
        this.taskPrioritizationService.prioritizeTasks(tasks, data.criteria);

      // Map to DTO
      const responseDto: TaskPrioritizationResponseDto = {
        prioritizedTasks: prioritizationResult.prioritizedTasks.map((pt) => ({
          task: this.mapToResponseDto(pt.task),
          score: pt.score,
          recommendation: pt.recommendation,
          factors: pt.factors,
        })),
        summary: prioritizationResult.summary,
        recommendations: prioritizationResult.recommendations,
      };

      return Result.success(responseDto);
    } catch (error) {
      return Result.failure('Failed to prioritize tasks');
    }
  }

  async getTasksByPriority(
    priority: string,
  ): Promise<Result<TaskResponseDto[], string>> {
    try {
      const tasks = await this.taskRepository.findByPriority(
        new Priority(priority),
      );
      const responseDtos = tasks.map((task) => this.mapToResponseDto(task));
      return Result.success(responseDtos);
    } catch (error) {
      return Result.failure('Failed to retrieve tasks by priority');
    }
  }

  async getTasksByStatus(
    status: string,
  ): Promise<Result<TaskResponseDto[], string>> {
    try {
      const tasks = await this.taskRepository.findByStatus(
        new TaskStatus(status),
      );
      const responseDtos = tasks.map((task) => this.mapToResponseDto(task));
      return Result.success(responseDtos);
    } catch (error) {
      return Result.failure('Failed to retrieve tasks by status');
    }
  }

  async getOverdueTasks(): Promise<Result<TaskResponseDto[], string>> {
    try {
      const tasks = await this.taskRepository.findOverdueTasks();
      const responseDtos = tasks.map((task) => this.mapToResponseDto(task));
      return Result.success(responseDtos);
    } catch (error) {
      return Result.failure('Failed to retrieve overdue tasks');
    }
  }

  async getTaskAnalytics(): Promise<Result<TaskAnalyticsResponseDto, string>> {
    try {
      const analytics = await this.taskRepository.getTaskAnalytics();
      return Result.success(analytics);
    } catch (error) {
      return Result.failure('Failed to retrieve task analytics');
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
