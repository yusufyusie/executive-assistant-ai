/**
 * Task Entity Tests - Domain Layer
 * Comprehensive unit tests for Task entity
 */

import { Task } from '../task.entity';
import { Priority, TaskStatus, Email } from '../../common/value-objects';

describe('Task Entity', () => {
  describe('Task Creation', () => {
    it('should create a task with valid properties', () => {
      const taskProps = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending' as const,
        priority: 'high' as const,
        assignee: 'test@example.com',
        dueDate: new Date('2025-12-31'),
        tags: ['urgent', 'important'],
        estimatedDuration: 120,
        dependencies: [],
      };

      const task = Task.create(taskProps);

      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.status.value).toBe('pending');
      expect(task.priority.value).toBe('high');
      expect(task.assignee?.value).toBe('test@example.com');
      expect(task.tags).toEqual(['urgent', 'important']);
      expect(task.estimatedDuration).toBe(120);
    });

    it('should throw error for invalid email', () => {
      const taskProps = {
        title: 'Test Task',
        status: 'pending' as const,
        priority: 'high' as const,
        assignee: 'invalid-email',
      };

      expect(() => Task.create(taskProps)).toThrow('Invalid email format');
    });

    it('should throw error for invalid priority', () => {
      const taskProps = {
        title: 'Test Task',
        status: 'pending' as const,
        priority: 'invalid' as any,
      };

      expect(() => Task.create(taskProps)).toThrow('Invalid priority');
    });
  });

  describe('Task Business Logic', () => {
    let task: Task;

    beforeEach(() => {
      task = Task.create({
        title: 'Test Task',
        status: 'pending' as const,
        priority: 'medium' as const,
      });
    });

    it('should mark task as completed', () => {
      task.markAsCompleted();

      expect(task.status.value).toBe('completed');
      expect(task.completedAt).toBeDefined();
      expect(task.isCompleted).toBe(true);
    });

    it('should update priority', () => {
      task.updatePriority('urgent');

      expect(task.priority.value).toBe('urgent');
    });

    it('should calculate urgency score correctly', () => {
      // Task with high priority and near due date should have high urgency
      const urgentTask = Task.create({
        title: 'Urgent Task',
        status: 'pending' as const,
        priority: 'urgent' as const,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
      });

      const urgencyScore = urgentTask.calculateUrgencyScore();
      expect(urgencyScore).toBeGreaterThan(80);
    });

    it('should detect overdue tasks', () => {
      const overdueTask = Task.create({
        title: 'Overdue Task',
        status: 'pending' as const,
        priority: 'medium' as const,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Due yesterday
      });

      expect(overdueTask.isOverdue).toBe(true);
    });

    it('should add and remove tags', () => {
      task.addTag('important');
      expect(task.tags).toContain('important');

      task.removeTag('important');
      expect(task.tags).not.toContain('important');
    });

    it('should not add duplicate tags', () => {
      task.addTag('important');
      task.addTag('important');

      expect(task.tags.filter((tag) => tag === 'important')).toHaveLength(1);
    });
  });

  describe('Task Dependencies', () => {
    it('should add dependencies', () => {
      const task = Task.create({
        title: 'Dependent Task',
        status: 'pending' as const,
        priority: 'medium' as const,
      });

      task.addDependency('task-1');
      task.addDependency('task-2');

      expect(task.dependencies).toEqual(['task-1', 'task-2']);
    });

    it('should remove dependencies', () => {
      const task = Task.create({
        title: 'Dependent Task',
        status: 'pending' as const,
        priority: 'medium' as const,
        dependencies: ['task-1', 'task-2'],
      });

      task.removeDependency('task-1');

      expect(task.dependencies).toEqual(['task-2']);
    });

    it('should check if task can be started', () => {
      const task = Task.create({
        title: 'Dependent Task',
        status: 'pending' as const,
        priority: 'medium' as const,
        dependencies: ['task-1'],
      });

      // Mock completed dependencies
      const completedDependencies = new Set(['task-1']);
      expect(task.canBeStarted(completedDependencies)).toBe(true);

      const incompleteDependencies = new Set<string>();
      expect(task.canBeStarted(incompleteDependencies)).toBe(false);
    });
  });

  describe('Task Events', () => {
    it('should raise TaskCreatedEvent on creation', () => {
      const task = Task.create({
        title: 'Test Task',
        status: 'pending' as const,
        priority: 'medium' as const,
      });

      const events = task.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('TaskCreated');
    });

    it('should raise TaskCompletedEvent when completed', () => {
      const task = Task.create({
        title: 'Test Task',
        status: 'pending' as const,
        priority: 'medium' as const,
      });

      task.markUncommittedEvents(); // Clear creation event
      task.markAsCompleted();

      const events = task.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('TaskCompleted');
    });

    it('should raise TaskPriorityChangedEvent when priority changes', () => {
      const task = Task.create({
        title: 'Test Task',
        status: 'pending' as const,
        priority: 'medium' as const,
      });

      task.markUncommittedEvents(); // Clear creation event
      task.updatePriority('urgent');

      const events = task.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('TaskPriorityChanged');
    });
  });

  describe('Task Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const task = Task.create({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending' as const,
        priority: 'high' as const,
        assignee: 'test@example.com',
        tags: ['urgent'],
        estimatedDuration: 60,
      });

      const json = task.toJSON();

      expect(json).toMatchObject({
        id: expect.any(String),
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        assignee: 'test@example.com',
        tags: ['urgent'],
        estimatedDuration: 60,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should create task from JSON', () => {
      const json = {
        id: 'test-id',
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      const task = Task.fromJSON(json);

      expect(task.id).toBe('test-id');
      expect(task.title).toBe('Test Task');
      expect(task.status.value).toBe('pending');
      expect(task.priority.value).toBe('medium');
    });
  });
});
