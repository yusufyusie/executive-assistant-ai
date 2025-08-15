/**
 * In-Memory Task Repository Implementation - Infrastructure Layer
 * Concrete implementation of task repository for development/testing
 */

import { Injectable } from '@nestjs/common';
import { TaskRepository, TaskQueryOptions } from '../../../domain/repositories/task.repository';
import { Task } from '../../../domain/entities/task.entity';
import { Priority, TaskStatus } from '../../../domain/common/value-objects';
import { QueryResult } from '../../../domain/common/repository.interface';

@Injectable()
export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Map<string, Task> = new Map();

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
    // In a real implementation, this would also handle domain events
    task.markEventsAsCommitted();
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.status.equals(status)
    );
  }

  async findByPriority(priority: Priority): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.priority.equals(priority)
    );
  }

  async findByAssignee(assigneeEmail: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.assignee?.value === assigneeEmail
    );
  }

  async findOverdueTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.isOverdue);
  }

  async findTasksDueWithin(days: number): Promise<Task[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return Array.from(this.tasks.values()).filter(task => {
      if (!task.dueDate) return false;
      return task.dueDate <= cutoffDate && task.dueDate >= new Date();
    });
  }

  async findByTags(tags: string[]): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      tags.some(tag => task.tags.includes(tag.toLowerCase()))
    );
  }

  async findMany(options?: TaskQueryOptions): Promise<QueryResult<Task>> {
    let tasks = Array.from(this.tasks.values());

    // Apply filters
    if (options?.filters) {
      tasks = this.applyFilters(tasks, options.filters);
    }

    // Apply sorting
    if (options?.sortBy) {
      tasks = this.applySorting(tasks, options.sortBy, options.sortOrder || 'asc');
    }

    // Calculate total before pagination
    const total = tasks.length;

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;
    const paginatedTasks = tasks.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      items: paginatedTasks,
      total,
      hasMore,
    };
  }

  async countByStatus(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {
      pending: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0,
    };

    for (const task of this.tasks.values()) {
      counts[task.status.value]++;
    }

    return counts;
  }

  async countByPriority(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    for (const task of this.tasks.values()) {
      counts[task.priority.value]++;
    }

    return counts;
  }

  async getTaskAnalytics(): Promise<{
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
    averageCompletionTime: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const tasks = Array.from(this.tasks.values());
    const total = tasks.length;
    const completed = tasks.filter(t => t.status.value === 'completed').length;
    const overdue = tasks.filter(t => t.isOverdue).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Calculate average completion time
    const completedTasks = tasks.filter(t => t.completedAt);
    let averageCompletionTime = 0;
    
    if (completedTasks.length > 0) {
      const totalCompletionTime = completedTasks.reduce((sum, task) => {
        const createdAt = new Date(task.createdAt);
        const completedAt = task.completedAt!;
        return sum + (completedAt.getTime() - createdAt.getTime());
      }, 0);
      
      averageCompletionTime = totalCompletionTime / completedTasks.length / (1000 * 60 * 60 * 24); // in days
    }

    const byStatus = await this.countByStatus();
    const byPriority = await this.countByPriority();

    return {
      total,
      completed,
      overdue,
      completionRate,
      averageCompletionTime,
      byStatus,
      byPriority,
    };
  }

  private applyFilters(tasks: Task[], filters: any): Task[] {
    return tasks.filter(task => {
      if (filters.status && !task.status.equals(filters.status)) {
        return false;
      }

      if (filters.priority && !task.priority.equals(filters.priority)) {
        return false;
      }

      if (filters.assignee && task.assignee?.value !== filters.assignee) {
        return false;
      }

      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag: string) => 
          task.tags.includes(tag.toLowerCase())
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      if (filters.dueDateFrom && task.dueDate && task.dueDate < filters.dueDateFrom) {
        return false;
      }

      if (filters.dueDateTo && task.dueDate && task.dueDate > filters.dueDateTo) {
        return false;
      }

      if (filters.isOverdue !== undefined && task.isOverdue !== filters.isOverdue) {
        return false;
      }

      if (filters.hasAssignee !== undefined) {
        const hasAssignee = task.assignee !== undefined;
        if (hasAssignee !== filters.hasAssignee) {
          return false;
        }
      }

      return true;
    });
  }

  private applySorting(tasks: Task[], sortBy: string, sortOrder: 'asc' | 'desc'): Task[] {
    return tasks.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
        case 'priority':
          comparison = a.priority.numericValue - b.priority.numericValue;
          break;
        case 'urgencyScore':
          comparison = a.urgencyScore - b.urgencyScore;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }
}
