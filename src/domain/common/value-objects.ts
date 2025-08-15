/**
 * Value Objects - Domain Layer
 * Immutable objects that represent domain concepts
 */

export abstract class ValueObject {
  public abstract equals(other: ValueObject): boolean;
  public abstract toJSON(): Record<string, any>;
}

export class Email extends ValueObject {
  private readonly _value: string;

  constructor(email: string) {
    super();
    this.validateEmail(email);
    this._value = email.toLowerCase().trim();
  }

  get value(): string {
    return this._value;
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
  }

  public equals(other: Email): boolean {
    return other instanceof Email && this._value === other._value;
  }

  public toJSON(): Record<string, any> {
    return { email: this._value };
  }
}

export class Priority extends ValueObject {
  private readonly _value: 'low' | 'medium' | 'high' | 'urgent';

  constructor(priority: string) {
    super();
    this.validatePriority(priority);
    this._value = priority as 'low' | 'medium' | 'high' | 'urgent';
  }

  get value(): 'low' | 'medium' | 'high' | 'urgent' {
    return this._value;
  }

  get numericValue(): number {
    const priorityMap = { low: 1, medium: 2, high: 3, urgent: 4 };
    return priorityMap[this._value];
  }

  private validatePriority(priority: string): void {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid priority: ${priority}. Must be one of: ${validPriorities.join(', ')}`);
    }
  }

  public equals(other: Priority): boolean {
    return other instanceof Priority && this._value === other._value;
  }

  public toJSON(): Record<string, any> {
    return { priority: this._value, numericValue: this.numericValue };
  }
}

export class TaskStatus extends ValueObject {
  private readonly _value: 'pending' | 'in-progress' | 'completed' | 'cancelled';

  constructor(status: string) {
    super();
    this.validateStatus(status);
    this._value = status as 'pending' | 'in-progress' | 'completed' | 'cancelled';
  }

  get value(): 'pending' | 'in-progress' | 'completed' | 'cancelled' {
    return this._value;
  }

  get isCompleted(): boolean {
    return this._value === 'completed';
  }

  get isActive(): boolean {
    return this._value === 'pending' || this._value === 'in-progress';
  }

  private validateStatus(status: string): void {
    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  public equals(other: TaskStatus): boolean {
    return other instanceof TaskStatus && this._value === other._value;
  }

  public toJSON(): Record<string, any> {
    return { 
      status: this._value, 
      isCompleted: this.isCompleted, 
      isActive: this.isActive 
    };
  }
}

export class DateRange extends ValueObject {
  private readonly _startDate: Date;
  private readonly _endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    super();
    this.validateDateRange(startDate, endDate);
    this._startDate = new Date(startDate);
    this._endDate = new Date(endDate);
  }

  get startDate(): Date {
    return new Date(this._startDate);
  }

  get endDate(): Date {
    return new Date(this._endDate);
  }

  get durationInMinutes(): number {
    return Math.floor((this._endDate.getTime() - this._startDate.getTime()) / (1000 * 60));
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }
  }

  public overlaps(other: DateRange): boolean {
    return this._startDate < other._endDate && this._endDate > other._startDate;
  }

  public contains(date: Date): boolean {
    return date >= this._startDate && date <= this._endDate;
  }

  public equals(other: DateRange): boolean {
    return other instanceof DateRange && 
           this._startDate.getTime() === other._startDate.getTime() &&
           this._endDate.getTime() === other._endDate.getTime();
  }

  public toJSON(): Record<string, any> {
    return {
      startDate: this._startDate.toISOString(),
      endDate: this._endDate.toISOString(),
      durationInMinutes: this.durationInMinutes,
    };
  }
}
