/**
 * Task DTOs - Application Layer
 * Data Transfer Objects for task operations
 */

export class CreateTaskDto {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: string; // ISO string
  tags?: string[];
  estimatedDuration?: number; // in minutes
  dependencies?: string[];
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignee?: string;
  dueDate?: string; // ISO string
  tags?: string[];
  estimatedDuration?: number; // in minutes
  dependencies?: string[];
}

export class TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  status: {
    status: string;
    isCompleted: boolean;
    isActive: boolean;
  };
  priority: {
    priority: string;
    numericValue: number;
  };
  assignee?: {
    email: string;
  };
  dueDate?: string;
  tags: string[];
  estimatedDuration?: number;
  dependencies: string[];
  completedAt?: string;
  isOverdue: boolean;
  urgencyScore: number;
  createdAt: string;
  updatedAt: string;
}

export class TaskFiltersDto {
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  isOverdue?: boolean;
  hasAssignee?: boolean;
}

export class TaskQueryDto {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: TaskFiltersDto;
}

export class PrioritizeTasksDto {
  taskIds?: string[];
  criteria?: {
    dueDateWeight?: number;
    priorityWeight?: number;
    statusWeight?: number;
    dependencyWeight?: number;
    estimatedDurationWeight?: number;
  };
}

export class TaskPrioritizationResponseDto {
  prioritizedTasks: Array<{
    task: TaskResponseDto;
    score: number;
    recommendation: string;
    factors: {
      dueDate: number;
      priority: number;
      status: number;
      dependencies: number;
      estimatedDuration: number;
    };
  }>;
  summary: {
    totalTasks: number;
    criticalTasks: number;
    highPriorityTasks: number;
    mediumPriorityTasks: number;
    lowPriorityTasks: number;
  };
  recommendations: string[];
}

export class TaskAnalyticsResponseDto {
  total: number;
  completed: number;
  overdue: number;
  completionRate: number;
  averageCompletionTime: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export class TaskListResponseDto {
  items: TaskResponseDto[];
  total: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
  };
}
