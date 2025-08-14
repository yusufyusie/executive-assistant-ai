import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, ScheduleReminderDto } from '../common/dto';
import { Task, TaskPriority, TaskStatus, TaskReminder } from '../common/interfaces';

@Controller('api/tasks')
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getTasks(
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('assignedTo') assignedTo?: string,
    @Query('createdBy') createdBy?: string,
    @Query('tags') tags?: string,
    @Query('dueBefore') dueBefore?: string,
    @Query('dueAfter') dueAfter?: string,
  ): Promise<Task[]> {
    this.logger.log('Fetching tasks with filters');
    
    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (createdBy) filters.createdBy = createdBy;
    if (tags) filters.tags = tags.split(',');
    if (dueBefore) filters.dueBefore = new Date(dueBefore);
    if (dueAfter) filters.dueAfter = new Date(dueAfter);

    return this.tasksService.getAllTasks(filters);
  }

  @Get('priority')
  async getPriorityTasks(@Query('limit') limit?: string): Promise<Task[]> {
    this.logger.log('Fetching priority tasks');
    
    const maxResults = limit ? parseInt(limit, 10) : 10;
    return this.tasksService.getPriorityTasks(maxResults);
  }

  @Get('overdue')
  async getOverdueTasks(): Promise<Task[]> {
    this.logger.log('Fetching overdue tasks');
    
    return this.tasksService.getOverdueTasks();
  }

  @Get('user/:userId')
  async getTasksForUser(@Param('userId') userId: string): Promise<Task[]> {
    this.logger.log(`Fetching tasks for user: ${userId}`);
    
    return this.tasksService.getTasksForUser(userId);
  }

  @Get('analytics')
  async getTaskAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    this.logger.log('Generating task analytics');
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    return this.tasksService.getTaskAnalytics({ start, end });
  }

  @Get(':id')
  async getTask(@Param('id') taskId: string): Promise<Task | null> {
    this.logger.log(`Fetching task: ${taskId}`);
    
    const task = this.tasksService.getTask(taskId);
    return task || null;
  }

  @Post()
  async createTask(@Body() dto: CreateTaskDto): Promise<Task> {
    this.logger.log(`Creating task: ${dto.title}`);
    
    const taskData = {
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: TaskStatus.TODO,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assignedTo: dto.assignedTo,
      createdBy: 'assistant@company.com', // In a real app, get from auth context
      tags: dto.tags || [],
    };

    return this.tasksService.createTask(taskData);
  }

  @Put(':id')
  async updateTask(
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task | null> {
    this.logger.log(`Updating task: ${taskId}`);
    
    const updates: Partial<Task> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.dueDate !== undefined) updates.dueDate = new Date(dto.dueDate);
    if (dto.assignedTo !== undefined) updates.assignedTo = dto.assignedTo;
    if (dto.tags !== undefined) updates.tags = dto.tags;

    return this.tasksService.updateTask(taskId, updates);
  }

  @Delete(':id')
  async deleteTask(@Param('id') taskId: string): Promise<{ success: boolean }> {
    this.logger.log(`Deleting task: ${taskId}`);
    
    const success = this.tasksService.deleteTask(taskId);
    return { success };
  }

  @Post(':id/reminders')
  async createReminder(
    @Param('id') taskId: string,
    @Body() dto: ScheduleReminderDto,
  ): Promise<TaskReminder | null> {
    this.logger.log(`Creating reminder for task: ${taskId}`);
    
    return this.tasksService.createReminder(
      taskId,
      new Date(dto.reminderTime),
      dto.message,
    );
  }

  @Post('bulk-update')
  async bulkUpdateTasks(
    @Body() body: {
      taskIds: string[];
      updates: Partial<Task>;
    },
  ): Promise<{
    updated: number;
    failed: number;
    results: Array<{ taskId: string; success: boolean; task?: Task; error?: string }>;
  }> {
    this.logger.log(`Bulk updating ${body.taskIds.length} tasks`);
    
    const results: Array<{ taskId: string; success: boolean; task?: Task; error?: string }> = [];
    let updated = 0;
    let failed = 0;

    for (const taskId of body.taskIds) {
      try {
        const task = this.tasksService.updateTask(taskId, body.updates);
        if (task) {
          updated++;
          results.push({ taskId, success: true, task });
        } else {
          failed++;
          results.push({ taskId, success: false, error: 'Task not found' });
        }
      } catch (error) {
        failed++;
        results.push({ taskId, success: false, error: error.message });
      }
    }

    return { updated, failed, results };
  }

  @Post('smart-prioritize')
  async smartPrioritize(
    @Body() body: { userId?: string; context?: any },
  ): Promise<{
    reprioritizedTasks: Task[];
    suggestions: string[];
    reasoning: string[];
  }> {
    this.logger.log('Performing smart task prioritization');
    
    // Get all pending tasks
    const pendingTasks = this.tasksService.getAllTasks({
      status: TaskStatus.TODO,
      assignedTo: body.userId,
    });

    // Simple smart prioritization logic
    const now = new Date();
    const reprioritizedTasks: Task[] = [];
    const suggestions: string[] = [];
    const reasoning: string[] = [];

    for (const task of pendingTasks) {
      let newPriority = task.priority;
      let shouldUpdate = false;

      // Increase priority if due soon
      if (task.dueDate) {
        const hoursUntilDue = (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilDue <= 24 && task.priority !== TaskPriority.URGENT) {
          newPriority = TaskPriority.URGENT;
          shouldUpdate = true;
          reasoning.push(`"${task.title}" upgraded to urgent - due within 24 hours`);
        } else if (hoursUntilDue <= 72 && task.priority === TaskPriority.MEDIUM) {
          newPriority = TaskPriority.HIGH;
          shouldUpdate = true;
          reasoning.push(`"${task.title}" upgraded to high priority - due within 3 days`);
        }
      }

      // Check for important keywords in title/description
      const importantKeywords = ['budget', 'board', 'client', 'urgent', 'critical', 'deadline'];
      const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
      
      if (importantKeywords.some(keyword => taskText.includes(keyword)) && 
          task.priority === TaskPriority.LOW) {
        newPriority = TaskPriority.MEDIUM;
        shouldUpdate = true;
        reasoning.push(`"${task.title}" upgraded due to important keywords`);
      }

      if (shouldUpdate) {
        const updatedTask = this.tasksService.updateTask(task.id, { priority: newPriority });
        if (updatedTask) {
          reprioritizedTasks.push(updatedTask);
        }
      }
    }

    // Generate suggestions
    const overdueTasks = this.tasksService.getOverdueTasks();
    if (overdueTasks.length > 0) {
      suggestions.push(`You have ${overdueTasks.length} overdue tasks that need immediate attention`);
    }

    const urgentTasks = this.tasksService.getPriorityTasks(5);
    if (urgentTasks.length > 3) {
      suggestions.push('Consider delegating some urgent tasks to reduce workload');
    }

    if (pendingTasks.length > 20) {
      suggestions.push('Consider breaking down large tasks into smaller, manageable subtasks');
    }

    return {
      reprioritizedTasks,
      suggestions,
      reasoning,
    };
  }

  @Get('dashboard/summary')
  async getDashboardSummary(): Promise<{
    totalTasks: number;
    completedToday: number;
    priorityTasks: Task[];
    overdueTasks: Task[];
    upcomingDeadlines: Task[];
    completionRate: number;
  }> {
    this.logger.log('Generating dashboard summary');
    
    const allTasks = this.tasksService.getAllTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const completedToday = allTasks.filter(task => 
      task.status === TaskStatus.COMPLETED &&
      task.updatedAt >= today &&
      task.updatedAt < tomorrow
    ).length;

    const priorityTasks = this.tasksService.getPriorityTasks(5);
    const overdueTasks = this.tasksService.getOverdueTasks();
    
    const upcomingDeadlines = allTasks.filter(task => 
      task.dueDate &&
      task.status === TaskStatus.TODO &&
      task.dueDate >= new Date() &&
      task.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
    ).slice(0, 5);

    const completedTasks = allTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const completionRate = allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0;

    return {
      totalTasks: allTasks.length,
      completedToday,
      priorityTasks,
      overdueTasks,
      upcomingDeadlines,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }
}
