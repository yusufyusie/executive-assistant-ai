/**
 * Task Service - Legacy Wrapper
 * Wrapper around TaskApplicationService for backward compatibility
 * @deprecated Use TaskApplicationService directly
 */

import { Injectable, Logger } from '@nestjs/common';
import { TaskApplicationService } from '../../../application/services/task-application.service';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly taskApplicationService: TaskApplicationService) {
    this.logger.warn(
      'TaskService is deprecated. Use TaskApplicationService directly.',
    );
  }

  // Legacy methods for backward compatibility
  async getTasks(filters?: any): Promise<any> {
    const result = await this.taskApplicationService.getTasks(filters);
    return result.isSuccess ? result.value : { items: [], total: 0 };
  }

  async createTask(taskData: any): Promise<any> {
    const result = await this.taskApplicationService.createTask(taskData);
    return result.isSuccess ? result.value : null;
  }

  async updateTask(id: string, updateData: any): Promise<any> {
    const result = await this.taskApplicationService.updateTask(id, updateData);
    return result.isSuccess ? result.value : null;
  }

  async deleteTask(id: string): Promise<void> {
    await this.taskApplicationService.deleteTask(id);
  }

  async smartPrioritize(tasks?: any[]): Promise<any> {
    const result = await this.taskApplicationService.prioritizeTasks({
      taskIds: tasks,
    });
    return result.isSuccess
      ? result.value
      : { prioritizedTasks: [], recommendations: [] };
  }

  async getTasksByPriority(priority: string): Promise<any[]> {
    const result =
      await this.taskApplicationService.getTasksByPriority(priority);
    return result.isSuccess ? result.value : [];
  }

  async getAnalytics(): Promise<any> {
    const result = await this.taskApplicationService.getTaskAnalytics();
    return result.isSuccess ? result.value : {};
  }

  getHealth(): any {
    return {
      status: 'healthy',
      service: 'TaskService (Legacy)',
      timestamp: new Date().toISOString(),
    };
  }
}
