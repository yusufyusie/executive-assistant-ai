/**
 * Task Repository Interface - Domain Layer
 * Contract for task data persistence
 */

import {
  Repository,
  ReadRepository,
  QueryOptions,
  QueryResult,
} from '../common/repository.interface';
import { Task } from '../entities/task.entity';
import { Priority, TaskStatus } from '../common/value-objects';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  assignee?: string;
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  isOverdue?: boolean;
  hasAssignee?: boolean;
}

export interface TaskQueryOptions extends QueryOptions {
  filters?: TaskFilters;
}

export interface TaskRepository extends Repository<Task> {
  findByStatus(status: TaskStatus): Promise<Task[]>;
  findByPriority(priority: Priority): Promise<Task[]>;
  findByAssignee(assigneeEmail: string): Promise<Task[]>;
  findOverdueTasks(): Promise<Task[]>;
  findTasksDueWithin(days: number): Promise<Task[]>;
  findByTags(tags: string[]): Promise<Task[]>;
  findMany(options?: TaskQueryOptions): Promise<QueryResult<Task>>;
  countByStatus(): Promise<Record<string, number>>;
  countByPriority(): Promise<Record<string, number>>;
  getTaskAnalytics(): Promise<{
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
    averageCompletionTime: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  }>;
}

export interface TaskReadRepository extends ReadRepository<Task> {
  findByStatus(status: TaskStatus): Promise<Task[]>;
  findByPriority(priority: Priority): Promise<Task[]>;
  findByAssignee(assigneeEmail: string): Promise<Task[]>;
  findOverdueTasks(): Promise<Task[]>;
  findTasksDueWithin(days: number): Promise<Task[]>;
  findByTags(tags: string[]): Promise<Task[]>;
  searchTasks(query: string): Promise<Task[]>;
}
