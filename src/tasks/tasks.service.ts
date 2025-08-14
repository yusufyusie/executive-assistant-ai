import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Task, TaskPriority, TaskStatus, TaskReminder } from '../common/interfaces';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly tasks: Map<string, Task> = new Map();
  private readonly reminders: Map<string, TaskReminder> = new Map();

  constructor(private configService: ConfigService) {
    this.loadSampleTasks();
  }

  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'reminders'>): Task {
    const task: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      reminders: [],
    };

    this.tasks.set(task.id, task);
    this.logger.log(`Task created: ${task.title} (${task.id})`);

    // Auto-create reminder if due date is set
    if (task.dueDate) {
      this.createAutomaticReminder(task);
    }

    return task;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string;
    createdBy?: string;
    tags?: string[];
    dueBefore?: Date;
    dueAfter?: Date;
  }): Task[] {
    let tasks = Array.from(this.tasks.values());

    if (filters) {
      if (filters.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }
      if (filters.priority) {
        tasks = tasks.filter(task => task.priority === filters.priority);
      }
      if (filters.assignedTo) {
        tasks = tasks.filter(task => task.assignedTo === filters.assignedTo);
      }
      if (filters.createdBy) {
        tasks = tasks.filter(task => task.createdBy === filters.createdBy);
      }
      if (filters.tags && filters.tags.length > 0) {
        tasks = tasks.filter(task =>
          filters.tags!.some(tag => task.tags.includes(tag))
        );
      }
      if (filters.dueBefore) {
        tasks = tasks.filter(task =>
          task.dueDate && task.dueDate <= filters.dueBefore!
        );
      }
      if (filters.dueAfter) {
        tasks = tasks.filter(task =>
          task.dueDate && task.dueDate >= filters.dueAfter!
        );
      }
    }

    // Sort by priority and due date
    return tasks.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      // If same priority, sort by due date
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      
      return 0;
    });
  }

  updateTask(taskId: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, updatedTask);
    this.logger.log(`Task updated: ${taskId}`);

    // Update reminders if due date changed
    if (updates.dueDate && updates.dueDate !== task.dueDate) {
      this.updateTaskReminders(updatedTask);
    }

    return updatedTask;
  }

  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // Delete associated reminders
    task.reminders.forEach(reminder => {
      this.reminders.delete(reminder.id);
    });

    const deleted = this.tasks.delete(taskId);
    if (deleted) {
      this.logger.log(`Task deleted: ${taskId}`);
    }
    
    return deleted;
  }

  createReminder(taskId: string, reminderTime: Date, message: string): TaskReminder | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    const reminder: TaskReminder = {
      id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      reminderTime,
      message,
      sent: false,
    };

    this.reminders.set(reminder.id, reminder);
    
    // Add reminder to task
    task.reminders.push(reminder);
    this.tasks.set(taskId, task);

    this.logger.log(`Reminder created for task ${taskId} at ${reminderTime.toISOString()}`);
    return reminder;
  }

  getPriorityTasks(limit: number = 10): Task[] {
    const now = new Date();
    const urgentTasks = this.getAllTasks({
      status: TaskStatus.TODO,
    }).filter(task => {
      // Consider urgent if:
      // 1. Priority is urgent
      // 2. Due within 24 hours
      // 3. High priority and due within 3 days
      if (task.priority === TaskPriority.URGENT) return true;
      
      if (task.dueDate) {
        const hoursUntilDue = (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilDue <= 24) return true;
        if (task.priority === TaskPriority.HIGH && hoursUntilDue <= 72) return true;
      }
      
      return false;
    });

    return urgentTasks.slice(0, limit);
  }

  getOverdueTasks(): Task[] {
    const now = new Date();
    return this.getAllTasks({
      status: TaskStatus.TODO,
    }).filter(task => task.dueDate && task.dueDate < now);
  }

  getTasksForUser(userId: string): Task[] {
    return this.getAllTasks({
      assignedTo: userId,
      status: TaskStatus.TODO,
    });
  }

  getTaskAnalytics(period: { start: Date; end: Date }) {
    const tasksInPeriod = Array.from(this.tasks.values()).filter(task => {
      return task.createdAt >= period.start && task.createdAt <= period.end;
    });

    const completed = tasksInPeriod.filter(task => task.status === TaskStatus.COMPLETED).length;
    const inProgress = tasksInPeriod.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const todo = tasksInPeriod.filter(task => task.status === TaskStatus.TODO).length;
    const cancelled = tasksInPeriod.filter(task => task.status === TaskStatus.CANCELLED).length;

    const priorityBreakdown = {
      urgent: tasksInPeriod.filter(task => task.priority === TaskPriority.URGENT).length,
      high: tasksInPeriod.filter(task => task.priority === TaskPriority.HIGH).length,
      medium: tasksInPeriod.filter(task => task.priority === TaskPriority.MEDIUM).length,
      low: tasksInPeriod.filter(task => task.priority === TaskPriority.LOW).length,
    };

    const completionRate = tasksInPeriod.length > 0 ? (completed / tasksInPeriod.length) * 100 : 0;

    return {
      total: tasksInPeriod.length,
      completed,
      inProgress,
      todo,
      cancelled,
      completionRate: Math.round(completionRate * 100) / 100,
      priorityBreakdown,
      period,
    };
  }

  // Automated reminder checking (runs every hour)
  @Cron(CronExpression.EVERY_HOUR)
  async checkReminders() {
    const now = new Date();
    const pendingReminders = Array.from(this.reminders.values()).filter(
      reminder => !reminder.sent && reminder.reminderTime <= now
    );

    for (const reminder of pendingReminders) {
      await this.sendReminder(reminder);
    }
  }

  // Daily task summary (runs at 8 AM)
  @Cron('0 8 * * *')
  async generateDailyTaskSummary() {
    this.logger.log('Generating daily task summary');
    
    const priorityTasks = this.getPriorityTasks(5);
    const overdueTasks = this.getOverdueTasks();
    
    // In a real implementation, this would send notifications or emails
    this.logger.log(`Priority tasks: ${priorityTasks.length}, Overdue tasks: ${overdueTasks.length}`);
  }

  private createAutomaticReminder(task: Task) {
    if (!task.dueDate) return;

    const reminderAdvanceHours = this.configService.get<number>('application.taskReminderAdvanceHours') || 24;
    const reminderTime = new Date(task.dueDate.getTime() - reminderAdvanceHours * 60 * 60 * 1000);

    // Only create reminder if it's in the future
    if (reminderTime > new Date()) {
      this.createReminder(
        task.id,
        reminderTime,
        `Reminder: "${task.title}" is due in ${reminderAdvanceHours} hours`
      );
    }
  }

  private updateTaskReminders(task: Task) {
    // Remove existing automatic reminders
    task.reminders.forEach(reminder => {
      if (reminder.message.startsWith('Reminder:') && !reminder.sent) {
        this.reminders.delete(reminder.id);
      }
    });

    // Filter out deleted reminders from task
    task.reminders = task.reminders.filter(reminder => this.reminders.has(reminder.id));

    // Create new automatic reminder
    this.createAutomaticReminder(task);
  }

  private async sendReminder(reminder: TaskReminder) {
    try {
      const task = this.tasks.get(reminder.taskId);
      if (!task) {
        this.logger.warn(`Task not found for reminder: ${reminder.id}`);
        return;
      }

      // In a real implementation, this would send email, SMS, or push notification
      this.logger.log(`Sending reminder: ${reminder.message} for task: ${task.title}`);

      // Mark reminder as sent
      reminder.sent = true;
      reminder.sentAt = new Date();
      this.reminders.set(reminder.id, reminder);

      // Update task with sent reminder
      const updatedTask = { ...task };
      const reminderIndex = updatedTask.reminders.findIndex(r => r.id === reminder.id);
      if (reminderIndex >= 0) {
        updatedTask.reminders[reminderIndex] = reminder;
        this.tasks.set(task.id, updatedTask);
      }
    } catch (error) {
      this.logger.error(`Error sending reminder ${reminder.id}:`, error);
    }
  }

  private loadSampleTasks() {
    // Create some sample tasks for demonstration
    const sampleTasks = [
      {
        title: 'Review Q4 Budget Proposal',
        description: 'Review and provide feedback on the Q4 budget proposal from finance team',
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
        assignedTo: 'executive@company.com',
        createdBy: 'assistant@company.com',
        tags: ['finance', 'budget', 'review'],
      },
      {
        title: 'Prepare Board Meeting Presentation',
        description: 'Create presentation slides for next week\'s board meeting',
        priority: TaskPriority.URGENT,
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
        assignedTo: 'executive@company.com',
        createdBy: 'assistant@company.com',
        tags: ['presentation', 'board', 'meeting'],
      },
      {
        title: 'Schedule Team Building Event',
        description: 'Organize and schedule quarterly team building event',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 2 weeks
        assignedTo: 'hr@company.com',
        createdBy: 'executive@company.com',
        tags: ['team', 'event', 'hr'],
      },
    ];

    sampleTasks.forEach(taskData => {
      this.createTask(taskData);
    });

    this.logger.log('Sample tasks loaded');
  }
}
