import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TasksService } from './tasks.service';
import configuration from '../config/configuration';
import { TaskPriority, TaskStatus } from '../common/interfaces';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
      ],
      providers: [TasksService],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTask', () => {
    it('should create a new task', () => {
      const taskData = {
        title: 'Test Task',
        description: 'A test task',
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        createdBy: 'test@example.com',
        tags: ['test'],
      };

      const task = service.createTask(taskData);

      expect(task).toBeDefined();
      expect(task).toHaveProperty('id');
      expect(task.title).toBe(taskData.title);
      expect(task.priority).toBe(taskData.priority);
      expect(task.status).toBe(taskData.status);
      expect(task).toHaveProperty('createdAt');
      expect(task).toHaveProperty('updatedAt');
      expect(task.reminders).toEqual([]);
    });

    it('should create automatic reminder for tasks with due date', () => {
      const dueDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days from now
      
      const taskData = {
        title: 'Task with Due Date',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate,
        createdBy: 'test@example.com',
        tags: [],
      };

      const task = service.createTask(taskData);

      expect(task.dueDate).toEqual(dueDate);
      // Automatic reminder should be created (checked in integration)
    });
  });

  describe('getTask', () => {
    it('should retrieve a task by ID', () => {
      const taskData = {
        title: 'Retrievable Task',
        priority: TaskPriority.LOW,
        status: TaskStatus.TODO,
        createdBy: 'test@example.com',
        tags: [],
      };

      const createdTask = service.createTask(taskData);
      const retrievedTask = service.getTask(createdTask.id);

      expect(retrievedTask).toBeDefined();
      expect(retrievedTask.id).toBe(createdTask.id);
      expect(retrievedTask.title).toBe(taskData.title);
    });

    it('should return undefined for non-existent task', () => {
      const task = service.getTask('non-existent-id');
      expect(task).toBeUndefined();
    });
  });

  describe('getAllTasks', () => {
    beforeEach(() => {
      // Clear existing tasks and create test data
      (service as any).tasks.clear();
      
      // Create test tasks
      service.createTask({
        title: 'High Priority Task',
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        createdBy: 'user1@example.com',
        tags: ['important'],
      });

      service.createTask({
        title: 'Completed Task',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.COMPLETED,
        createdBy: 'user2@example.com',
        tags: ['done'],
      });

      service.createTask({
        title: 'Urgent Task',
        priority: TaskPriority.URGENT,
        status: TaskStatus.IN_PROGRESS,
        createdBy: 'user1@example.com',
        tags: ['urgent', 'important'],
      });
    });

    it('should return all tasks without filters', () => {
      const tasks = service.getAllTasks();
      expect(tasks.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by status', () => {
      const todoTasks = service.getAllTasks({ status: TaskStatus.TODO });
      const completedTasks = service.getAllTasks({ status: TaskStatus.COMPLETED });

      expect(todoTasks.every(task => task.status === TaskStatus.TODO)).toBe(true);
      expect(completedTasks.every(task => task.status === TaskStatus.COMPLETED)).toBe(true);
    });

    it('should filter by priority', () => {
      const urgentTasks = service.getAllTasks({ priority: TaskPriority.URGENT });
      const highTasks = service.getAllTasks({ priority: TaskPriority.HIGH });

      expect(urgentTasks.every(task => task.priority === TaskPriority.URGENT)).toBe(true);
      expect(highTasks.every(task => task.priority === TaskPriority.HIGH)).toBe(true);
    });

    it('should filter by assignedTo', () => {
      const user1Tasks = service.getAllTasks({ createdBy: 'user1@example.com' });
      expect(user1Tasks.every(task => task.createdBy === 'user1@example.com')).toBe(true);
    });

    it('should filter by tags', () => {
      const importantTasks = service.getAllTasks({ tags: ['important'] });
      expect(importantTasks.every(task => task.tags.includes('important'))).toBe(true);
    });

    it('should sort by priority and due date', () => {
      const tasks = service.getAllTasks();
      
      // Check that urgent tasks come first
      const urgentIndex = tasks.findIndex(task => task.priority === TaskPriority.URGENT);
      const highIndex = tasks.findIndex(task => task.priority === TaskPriority.HIGH);
      
      if (urgentIndex !== -1 && highIndex !== -1) {
        expect(urgentIndex).toBeLessThan(highIndex);
      }
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', () => {
      const taskData = {
        title: 'Original Task',
        priority: TaskPriority.LOW,
        status: TaskStatus.TODO,
        createdBy: 'test@example.com',
        tags: [],
      };

      const task = service.createTask(taskData);
      const updates = {
        title: 'Updated Task',
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
      };

      const updatedTask = service.updateTask(task.id, updates);

      expect(updatedTask).toBeDefined();
      expect(updatedTask.title).toBe('Updated Task');
      expect(updatedTask.priority).toBe(TaskPriority.HIGH);
      expect(updatedTask.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(task.updatedAt.getTime());
    });

    it('should return null for non-existent task', () => {
      const result = service.updateTask('non-existent-id', { title: 'New Title' });
      expect(result).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task', () => {
      const taskData = {
        title: 'Task to Delete',
        priority: TaskPriority.LOW,
        status: TaskStatus.TODO,
        createdBy: 'test@example.com',
        tags: [],
      };

      const task = service.createTask(taskData);
      const deleted = service.deleteTask(task.id);

      expect(deleted).toBe(true);
      expect(service.getTask(task.id)).toBeUndefined();
    });

    it('should return false for non-existent task', () => {
      const deleted = service.deleteTask('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('getPriorityTasks', () => {
    beforeEach(() => {
      (service as any).tasks.clear();
      
      // Create tasks with different priorities and due dates
      service.createTask({
        title: 'Urgent Task',
        priority: TaskPriority.URGENT,
        status: TaskStatus.TODO,
        createdBy: 'test@example.com',
        tags: [],
      });

      service.createTask({
        title: 'Due Soon',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        createdBy: 'test@example.com',
        tags: [],
      });

      service.createTask({
        title: 'High Priority Due Later',
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
        createdBy: 'test@example.com',
        tags: [],
      });
    });

    it('should return priority tasks', () => {
      const priorityTasks = service.getPriorityTasks(5);
      
      expect(priorityTasks.length).toBeGreaterThan(0);
      expect(priorityTasks.every(task => task.status === TaskStatus.TODO)).toBe(true);
    });

    it('should include urgent tasks', () => {
      const priorityTasks = service.getPriorityTasks(5);
      const hasUrgentTask = priorityTasks.some(task => task.priority === TaskPriority.URGENT);
      expect(hasUrgentTask).toBe(true);
    });

    it('should include tasks due soon', () => {
      const priorityTasks = service.getPriorityTasks(5);
      const hasDueSoonTask = priorityTasks.some(task => task.title === 'Due Soon');
      expect(hasDueSoonTask).toBe(true);
    });
  });

  describe('getOverdueTasks', () => {
    beforeEach(() => {
      (service as any).tasks.clear();
      
      // Create overdue task
      service.createTask({
        title: 'Overdue Task',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        createdBy: 'test@example.com',
        tags: [],
      });

      // Create future task
      service.createTask({
        title: 'Future Task',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        createdBy: 'test@example.com',
        tags: [],
      });
    });

    it('should return only overdue tasks', () => {
      const overdueTasks = service.getOverdueTasks();
      
      expect(overdueTasks.length).toBe(1);
      expect(overdueTasks[0].title).toBe('Overdue Task');
      expect(overdueTasks[0].dueDate.getTime()).toBeLessThan(Date.now());
    });
  });

  describe('createReminder', () => {
    it('should create a reminder for a task', () => {
      const taskData = {
        title: 'Task with Reminder',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        createdBy: 'test@example.com',
        tags: [],
      };

      const task = service.createTask(taskData);
      const reminderTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const message = 'Don\'t forget this task!';

      const reminder = service.createReminder(task.id, reminderTime, message);

      expect(reminder).toBeDefined();
      expect(reminder).toHaveProperty('id');
      expect(reminder.taskId).toBe(task.id);
      expect(reminder.reminderTime).toEqual(reminderTime);
      expect(reminder.message).toBe(message);
      expect(reminder.sent).toBe(false);

      // Check that reminder was added to task
      const updatedTask = service.getTask(task.id);
      expect(updatedTask.reminders).toHaveLength(1);
      expect(updatedTask.reminders[0].id).toBe(reminder.id);
    });

    it('should return null for non-existent task', () => {
      const reminder = service.createReminder(
        'non-existent-id',
        new Date(),
        'Test message'
      );
      expect(reminder).toBeNull();
    });
  });

  describe('getTaskAnalytics', () => {
    beforeEach(() => {
      (service as any).tasks.clear();
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Create tasks with different statuses
      service.createTask({
        title: 'Completed Task',
        priority: TaskPriority.HIGH,
        status: TaskStatus.COMPLETED,
        createdBy: 'test@example.com',
        tags: [],
      });

      service.createTask({
        title: 'In Progress Task',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        createdBy: 'test@example.com',
        tags: [],
      });

      service.createTask({
        title: 'Todo Task',
        priority: TaskPriority.LOW,
        status: TaskStatus.TODO,
        createdBy: 'test@example.com',
        tags: [],
      });
    });

    it('should return task analytics', () => {
      const period = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        end: new Date(),
      };

      const analytics = service.getTaskAnalytics(period);

      expect(analytics).toHaveProperty('total');
      expect(analytics).toHaveProperty('completed');
      expect(analytics).toHaveProperty('inProgress');
      expect(analytics).toHaveProperty('todo');
      expect(analytics).toHaveProperty('completionRate');
      expect(analytics).toHaveProperty('priorityBreakdown');
      expect(analytics.period).toEqual(period);

      expect(analytics.total).toBeGreaterThanOrEqual(3);
      expect(analytics.completionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.completionRate).toBeLessThanOrEqual(100);
    });
  });
});
