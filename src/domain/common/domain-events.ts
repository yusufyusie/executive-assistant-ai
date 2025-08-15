/**
 * Domain Events - Domain Layer
 * Events that represent important business occurrences
 */

export interface DomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly occurredOn: Date;
  readonly eventData: Record<string, any>;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly eventType: string;
  public readonly occurredOn: Date;
  public readonly eventData: Record<string, any>;

  constructor(aggregateId: string, eventType: string, eventData: Record<string, any> = {}) {
    this.eventId = this.generateEventId();
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.occurredOn = new Date();
    this.eventData = eventData;
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Task Domain Events
export class TaskCreatedEvent extends BaseDomainEvent {
  constructor(taskId: string, taskData: Record<string, any>) {
    super(taskId, 'TaskCreated', taskData);
  }
}

export class TaskUpdatedEvent extends BaseDomainEvent {
  constructor(taskId: string, changes: Record<string, any>) {
    super(taskId, 'TaskUpdated', { changes });
  }
}

export class TaskCompletedEvent extends BaseDomainEvent {
  constructor(taskId: string, completedAt: Date) {
    super(taskId, 'TaskCompleted', { completedAt: completedAt.toISOString() });
  }
}

export class TaskPriorityChangedEvent extends BaseDomainEvent {
  constructor(taskId: string, oldPriority: string, newPriority: string) {
    super(taskId, 'TaskPriorityChanged', { oldPriority, newPriority });
  }
}

// Calendar Domain Events
export class MeetingScheduledEvent extends BaseDomainEvent {
  constructor(meetingId: string, meetingData: Record<string, any>) {
    super(meetingId, 'MeetingScheduled', meetingData);
  }
}

export class MeetingCancelledEvent extends BaseDomainEvent {
  constructor(meetingId: string, reason?: string) {
    super(meetingId, 'MeetingCancelled', { reason });
  }
}

export class MeetingReminderSentEvent extends BaseDomainEvent {
  constructor(meetingId: string, reminderType: string, sentAt: Date) {
    super(meetingId, 'MeetingReminderSent', { 
      reminderType, 
      sentAt: sentAt.toISOString() 
    });
  }
}

// Email Domain Events
export class EmailSentEvent extends BaseDomainEvent {
  constructor(emailId: string, emailData: Record<string, any>) {
    super(emailId, 'EmailSent', emailData);
  }
}

export class EmailFailedEvent extends BaseDomainEvent {
  constructor(emailId: string, error: string) {
    super(emailId, 'EmailFailed', { error });
  }
}

// Automation Domain Events
export class AutomationTriggeredEvent extends BaseDomainEvent {
  constructor(automationId: string, triggerType: string, context: Record<string, any>) {
    super(automationId, 'AutomationTriggered', { triggerType, context });
  }
}

export class AutomationCompletedEvent extends BaseDomainEvent {
  constructor(automationId: string, result: Record<string, any>) {
    super(automationId, 'AutomationCompleted', { result });
  }
}

export class AutomationFailedEvent extends BaseDomainEvent {
  constructor(automationId: string, error: string, context: Record<string, any>) {
    super(automationId, 'AutomationFailed', { error, context });
  }
}

// AI Assistant Domain Events
export class AssistantRequestProcessedEvent extends BaseDomainEvent {
  constructor(requestId: string, requestData: Record<string, any>, response: Record<string, any>) {
    super(requestId, 'AssistantRequestProcessed', { requestData, response });
  }
}

export class AssistantActionExecutedEvent extends BaseDomainEvent {
  constructor(actionId: string, actionType: string, result: Record<string, any>) {
    super(actionId, 'AssistantActionExecuted', { actionType, result });
  }
}
