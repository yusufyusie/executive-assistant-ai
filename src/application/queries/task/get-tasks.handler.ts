/**
 * Get Tasks Handler - Application Layer
 * Handles task retrieval queries
 */

import { Injectable, Inject } from '@nestjs/common';
import { QueryHandler } from '../../common/query.interface';
import { Result, success, failure } from '../../common/result';
import { GetTasksQuery } from './get-tasks.query';
import { TaskListResponseDto, TaskResponseDto } from '../../dtos/task.dto';
import type { TaskRepository } from '../../../domain/repositories/task.repository';
import { Priority, TaskStatus } from '../../../domain/common/value-objects';

@Injectable()
export class GetTasksHandler implements QueryHandler<GetTasksQuery, Result<TaskListResponseDto, string>> {
  constructor(@Inject('TaskRepository') private readonly taskRepository: TaskRepository) {}

  async handle(query: GetTasksQuery): Promise<Result<TaskListResponseDto, string>> {
    try {
      const options = query.options || {};
      const limit = options.limit || 20;
      const offset = options.offset || 0;

      // Build query options
      const queryOptions = {
        limit,
        offset,
        sortBy: options.sortBy || 'urgencyScore',
        sortOrder: options.sortOrder || 'desc' as const,
        filters: this.buildFilters(options.filters),
      };

      // Execute query
      const result = await this.taskRepository.findMany(queryOptions);

      // Map to DTOs
      const items = result.items.map(task => this.mapToResponseDto(task));

      // Calculate pagination
      const totalPages = Math.ceil(result.total / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      const response: TaskListResponseDto = {
        items,
        total: result.total,
        hasMore: result.hasMore,
        pagination: {
          limit,
          offset,
          totalPages,
          currentPage,
        },
      };

      return success(response);
    } catch (error) {
      return failure('Failed to retrieve tasks');
    }
  }

  private buildFilters(filters: any) {
    if (!filters) return undefined;

    const domainFilters: any = {};

    if (filters.status) {
      domainFilters.status = new TaskStatus(filters.status);
    }

    if (filters.priority) {
      domainFilters.priority = new Priority(filters.priority);
    }

    if (filters.assignee) {
      domainFilters.assignee = filters.assignee;
    }

    if (filters.tags) {
      domainFilters.tags = filters.tags;
    }

    if (filters.dueDateFrom) {
      domainFilters.dueDateFrom = new Date(filters.dueDateFrom);
    }

    if (filters.dueDateTo) {
      domainFilters.dueDateTo = new Date(filters.dueDateTo);
    }

    if (filters.isOverdue !== undefined) {
      domainFilters.isOverdue = filters.isOverdue;
    }

    if (filters.hasAssignee !== undefined) {
      domainFilters.hasAssignee = filters.hasAssignee;
    }

    return domainFilters;
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
