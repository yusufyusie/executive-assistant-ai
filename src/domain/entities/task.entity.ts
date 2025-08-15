/**
 * Task Entity - Domain Layer
 * Core business logic for task management
 */

import { AggregateRoot } from '../common/aggregate-root';
import { Priority, TaskStatus, Email } from '../common/value-objects';
import { 
  TaskCreatedEvent, 
  TaskUpdatedEvent, 
  TaskCompletedEvent, 
  TaskPriorityChangedEvent 
} from '../common/domain-events';

export interface TaskProps {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assignee?: Email;
  dueDate?: Date;
  tags?: string[];
  estimatedDuration?: number; // in minutes
  dependencies?: string[]; // task IDs
}

export class Task extends AggregateRoot {
  private _title: string;
  private _description?: string;
  private _status: TaskStatus;
  private _priority: Priority;
  private _assignee?: Email;
  private _dueDate?: Date;
  private _tags: string[];
  private _estimatedDuration?: number;
  private _dependencies: string[];
  private _completedAt?: Date;

  constructor(id: string, props: TaskProps, createdAt?: Date) {
    super(id, createdAt);
    this._title = props.title;
    this._description = props.description;
    this._status = props.status;
    this._priority = props.priority;
    this._assignee = props.assignee;
    this._dueDate = props.dueDate;
    this._tags = props.tags || [];
    this._estimatedDuration = props.estimatedDuration;
    this._dependencies = props.dependencies || [];

    this.addDomainEvent(new TaskCreatedEvent(this.id, this.toJSON()));
  }

  // Getters
  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  get status(): TaskStatus {
    return this._status;
  }

  get priority(): Priority {
    return this._priority;
  }

  get assignee(): Email | undefined {
    return this._assignee;
  }

  get dueDate(): Date | undefined {
    return this._dueDate ? new Date(this._dueDate) : undefined;
  }

  get tags(): readonly string[] {
    return [...this._tags];
  }

  get estimatedDuration(): number | undefined {
    return this._estimatedDuration;
  }

  get dependencies(): readonly string[] {
    return [...this._dependencies];
  }

  get completedAt(): Date | undefined {
    return this._completedAt ? new Date(this._completedAt) : undefined;
  }

  get isOverdue(): boolean {
    if (!this._dueDate || this._status.isCompleted) {
      return false;
    }
    return new Date() > this._dueDate;
  }

  get urgencyScore(): number {
    let score = this._priority.numericValue * 25; // Base priority score

    // Add urgency based on due date
    if (this._dueDate) {
      const daysUntilDue = Math.ceil(
        (this._dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilDue <= 0) score += 50; // Overdue
      else if (daysUntilDue <= 1) score += 30; // Due today/tomorrow
      else if (daysUntilDue <= 3) score += 15; // Due this week
      else if (daysUntilDue <= 7) score += 5; // Due next week
    }

    // Add score for in-progress tasks
    if (this._status.value === 'in-progress') score += 20;

    return Math.min(score, 100); // Cap at 100
  }

  // Business methods
  public updateTitle(newTitle: string): void {
    if (!newTitle.trim()) {
      throw new Error('Task title cannot be empty');
    }

    const oldTitle = this._title;
    this._title = newTitle.trim();
    this.markAsUpdated();

    this.addDomainEvent(new TaskUpdatedEvent(this.id, { 
      field: 'title', 
      oldValue: oldTitle, 
      newValue: this._title 
    }));
  }

  public updateDescription(description?: string): void {
    const oldDescription = this._description;
    this._description = description?.trim();
    this.markAsUpdated();

    this.addDomainEvent(new TaskUpdatedEvent(this.id, { 
      field: 'description', 
      oldValue: oldDescription, 
      newValue: this._description 
    }));
  }

  public changePriority(newPriority: Priority): void {
    if (this._priority.equals(newPriority)) {
      return; // No change needed
    }

    const oldPriority = this._priority;
    this._priority = newPriority;
    this.markAsUpdated();

    this.addDomainEvent(new TaskPriorityChangedEvent(
      this.id, 
      oldPriority.value, 
      newPriority.value
    ));
  }

  public changeStatus(newStatus: TaskStatus): void {
    if (this._status.equals(newStatus)) {
      return; // No change needed
    }

    const oldStatus = this._status;
    this._status = newStatus;
    this.markAsUpdated();

    // Set completion time if task is being completed
    if (newStatus.isCompleted && !oldStatus.isCompleted) {
      this._completedAt = new Date();
      this.addDomainEvent(new TaskCompletedEvent(this.id, this._completedAt));
    }

    this.addDomainEvent(new TaskUpdatedEvent(this.id, { 
      field: 'status', 
      oldValue: oldStatus.value, 
      newValue: newStatus.value 
    }));
  }

  public assignTo(assignee: Email): void {
    this._assignee = assignee;
    this.markAsUpdated();

    this.addDomainEvent(new TaskUpdatedEvent(this.id, { 
      field: 'assignee', 
      newValue: assignee.value 
    }));
  }

  public setDueDate(dueDate: Date): void {
    if (dueDate <= new Date()) {
      throw new Error('Due date must be in the future');
    }

    this._dueDate = new Date(dueDate);
    this.markAsUpdated();

    this.addDomainEvent(new TaskUpdatedEvent(this.id, { 
      field: 'dueDate', 
      newValue: this._dueDate.toISOString() 
    }));
  }

  public addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag || this._tags.includes(normalizedTag)) {
      return;
    }

    this._tags.push(normalizedTag);
    this.markAsUpdated();

    this.addDomainEvent(new TaskUpdatedEvent(this.id, { 
      field: 'tags', 
      action: 'added', 
      value: normalizedTag 
    }));
  }

  public removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    const index = this._tags.indexOf(normalizedTag);
    
    if (index === -1) {
      return;
    }

    this._tags.splice(index, 1);
    this.markAsUpdated();

    this.addDomainEvent(new TaskUpdatedEvent(this.id, { 
      field: 'tags', 
      action: 'removed', 
      value: normalizedTag 
    }));
  }

  public setEstimatedDuration(minutes: number): void {
    if (minutes <= 0) {
      throw new Error('Estimated duration must be positive');
    }

    this._estimatedDuration = minutes;
    this.markAsUpdated();

    this.addDomainEvent(new TaskUpdatedEvent(this.id, { 
      field: 'estimatedDuration', 
      newValue: minutes 
    }));
  }

  public addDependency(taskId: string): void {
    if (taskId === this.id) {
      throw new Error('Task cannot depend on itself');
    }

    if (!this._dependencies.includes(taskId)) {
      this._dependencies.push(taskId);
      this.markAsUpdated();

      this.addDomainEvent(new TaskUpdatedEvent(this.id, { 
        field: 'dependencies', 
        action: 'added', 
        value: taskId 
      }));
    }
  }

  public removeDependency(taskId: string): void {
    const index = this._dependencies.indexOf(taskId);
    if (index !== -1) {
      this._dependencies.splice(index, 1);
      this.markAsUpdated();

      this.addDomainEvent(new TaskUpdatedEvent(this.id, { 
        field: 'dependencies', 
        action: 'removed', 
        value: taskId 
      }));
    }
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      title: this._title,
      description: this._description,
      status: this._status.toJSON(),
      priority: this._priority.toJSON(),
      assignee: this._assignee?.toJSON(),
      dueDate: this._dueDate?.toISOString(),
      tags: [...this._tags],
      estimatedDuration: this._estimatedDuration,
      dependencies: [...this._dependencies],
      completedAt: this._completedAt?.toISOString(),
      isOverdue: this.isOverdue,
      urgencyScore: this.urgencyScore,
    };
  }

  // Factory method for creating tasks
  public static create(props: Omit<TaskProps, 'status' | 'priority' | 'assignee'> & {
    status?: string;
    priority?: string;
    assignee?: string;
  }): Task {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const taskProps: TaskProps = {
      ...props,
      status: new TaskStatus(props.status || 'pending'),
      priority: new Priority(props.priority || 'medium'),
      assignee: props.assignee ? new Email(props.assignee) : undefined,
    };

    return new Task(id, taskProps);
  }
}
