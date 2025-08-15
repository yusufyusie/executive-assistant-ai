/**
 * Meeting Entity - Domain Layer
 * Core business logic for meeting management
 */

import { AggregateRoot } from '../common/aggregate-root';
import { Email, DateRange } from '../common/value-objects';
import { 
  MeetingScheduledEvent, 
  MeetingCancelledEvent, 
  MeetingReminderSentEvent 
} from '../common/domain-events';

export interface Attendee {
  email: Email;
  name: string;
  isRequired: boolean;
  responseStatus: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export interface MeetingProps {
  title: string;
  description?: string;
  dateRange: DateRange;
  location?: string;
  organizer: Email;
  attendees: Attendee[];
  meetingType: 'in-person' | 'virtual' | 'hybrid';
  meetingUrl?: string;
  agenda?: string[];
  isRecurring?: boolean;
  recurrencePattern?: string;
}

export class Meeting extends AggregateRoot {
  private _title: string;
  private _description?: string;
  private _dateRange: DateRange;
  private _location?: string;
  private _organizer: Email;
  private _attendees: Attendee[];
  private _meetingType: 'in-person' | 'virtual' | 'hybrid';
  private _meetingUrl?: string;
  private _agenda: string[];
  private _isRecurring: boolean;
  private _recurrencePattern?: string;
  private _status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  private _remindersSent: Array<{ type: string; sentAt: Date }>;

  constructor(id: string, props: MeetingProps, createdAt?: Date) {
    super(id, createdAt);
    this.validateMeetingProps(props);
    
    this._title = props.title;
    this._description = props.description;
    this._dateRange = props.dateRange;
    this._location = props.location;
    this._organizer = props.organizer;
    this._attendees = props.attendees;
    this._meetingType = props.meetingType;
    this._meetingUrl = props.meetingUrl;
    this._agenda = props.agenda || [];
    this._isRecurring = props.isRecurring || false;
    this._recurrencePattern = props.recurrencePattern;
    this._status = 'scheduled';
    this._remindersSent = [];

    this.addDomainEvent(new MeetingScheduledEvent(this.id, this.toJSON()));
  }

  // Getters
  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  get dateRange(): DateRange {
    return this._dateRange;
  }

  get location(): string | undefined {
    return this._location;
  }

  get organizer(): Email {
    return this._organizer;
  }

  get attendees(): readonly Attendee[] {
    return [...this._attendees];
  }

  get meetingType(): 'in-person' | 'virtual' | 'hybrid' {
    return this._meetingType;
  }

  get meetingUrl(): string | undefined {
    return this._meetingUrl;
  }

  get agenda(): readonly string[] {
    return [...this._agenda];
  }

  get isRecurring(): boolean {
    return this._isRecurring;
  }

  get recurrencePattern(): string | undefined {
    return this._recurrencePattern;
  }

  get status(): 'scheduled' | 'in-progress' | 'completed' | 'cancelled' {
    return this._status;
  }

  get remindersSent(): readonly Array<{ type: string; sentAt: Date }> {
    return [...this._remindersSent];
  }

  get isUpcoming(): boolean {
    return this._status === 'scheduled' && this._dateRange.startDate > new Date();
  }

  get isInProgress(): boolean {
    const now = new Date();
    return this._status === 'scheduled' && this._dateRange.contains(now);
  }

  get hasConflictWith(other: Meeting): boolean {
    return this._dateRange.overlaps(other._dateRange);
  }

  // Business methods
  private validateMeetingProps(props: MeetingProps): void {
    if (!props.title.trim()) {
      throw new Error('Meeting title cannot be empty');
    }

    if (props.meetingType === 'virtual' && !props.meetingUrl) {
      throw new Error('Virtual meetings must have a meeting URL');
    }

    if (props.attendees.length === 0) {
      throw new Error('Meeting must have at least one attendee');
    }

    // Validate that organizer is in attendees list
    const organizerInAttendees = props.attendees.some(
      attendee => attendee.email.equals(props.organizer)
    );
    if (!organizerInAttendees) {
      throw new Error('Organizer must be included in attendees list');
    }
  }

  public updateTitle(newTitle: string): void {
    if (!newTitle.trim()) {
      throw new Error('Meeting title cannot be empty');
    }

    this._title = newTitle.trim();
    this.markAsUpdated();
  }

  public updateDescription(description?: string): void {
    this._description = description?.trim();
    this.markAsUpdated();
  }

  public reschedule(newDateRange: DateRange): void {
    if (this._status === 'cancelled' || this._status === 'completed') {
      throw new Error(`Cannot reschedule ${this._status} meeting`);
    }

    this._dateRange = newDateRange;
    this.markAsUpdated();
  }

  public addAttendee(attendee: Attendee): void {
    const existingAttendee = this._attendees.find(
      a => a.email.equals(attendee.email)
    );

    if (existingAttendee) {
      throw new Error(`Attendee ${attendee.email.value} is already invited`);
    }

    this._attendees.push(attendee);
    this.markAsUpdated();
  }

  public removeAttendee(email: Email): void {
    if (email.equals(this._organizer)) {
      throw new Error('Cannot remove the meeting organizer');
    }

    const index = this._attendees.findIndex(a => a.email.equals(email));
    if (index !== -1) {
      this._attendees.splice(index, 1);
      this.markAsUpdated();
    }
  }

  public updateAttendeeResponse(email: Email, responseStatus: Attendee['responseStatus']): void {
    const attendee = this._attendees.find(a => a.email.equals(email));
    if (!attendee) {
      throw new Error(`Attendee ${email.value} not found`);
    }

    attendee.responseStatus = responseStatus;
    this.markAsUpdated();
  }

  public addAgendaItem(item: string): void {
    if (!item.trim()) {
      return;
    }

    this._agenda.push(item.trim());
    this.markAsUpdated();
  }

  public removeAgendaItem(index: number): void {
    if (index >= 0 && index < this._agenda.length) {
      this._agenda.splice(index, 1);
      this.markAsUpdated();
    }
  }

  public cancel(reason?: string): void {
    if (this._status === 'cancelled') {
      return;
    }

    if (this._status === 'completed') {
      throw new Error('Cannot cancel a completed meeting');
    }

    this._status = 'cancelled';
    this.markAsUpdated();

    this.addDomainEvent(new MeetingCancelledEvent(this.id, reason));
  }

  public markAsCompleted(): void {
    if (this._status === 'completed') {
      return;
    }

    if (this._status === 'cancelled') {
      throw new Error('Cannot complete a cancelled meeting');
    }

    this._status = 'completed';
    this.markAsUpdated();
  }

  public recordReminderSent(reminderType: string): void {
    const sentAt = new Date();
    this._remindersSent.push({ type: reminderType, sentAt });
    this.markAsUpdated();

    this.addDomainEvent(new MeetingReminderSentEvent(this.id, reminderType, sentAt));
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      title: this._title,
      description: this._description,
      dateRange: this._dateRange.toJSON(),
      location: this._location,
      organizer: this._organizer.toJSON(),
      attendees: this._attendees.map(a => ({
        email: a.email.toJSON(),
        name: a.name,
        isRequired: a.isRequired,
        responseStatus: a.responseStatus,
      })),
      meetingType: this._meetingType,
      meetingUrl: this._meetingUrl,
      agenda: [...this._agenda],
      isRecurring: this._isRecurring,
      recurrencePattern: this._recurrencePattern,
      status: this._status,
      remindersSent: this._remindersSent.map(r => ({
        type: r.type,
        sentAt: r.sentAt.toISOString(),
      })),
      isUpcoming: this.isUpcoming,
      isInProgress: this.isInProgress,
    };
  }

  // Factory method
  public static create(props: Omit<MeetingProps, 'organizer' | 'attendees'> & {
    organizer: string;
    attendees: Array<Omit<Attendee, 'email'> & { email: string }>;
  }): Meeting {
    const id = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const meetingProps: MeetingProps = {
      ...props,
      organizer: new Email(props.organizer),
      attendees: props.attendees.map(a => ({
        ...a,
        email: new Email(a.email),
      })),
    };

    return new Meeting(id, meetingProps);
  }
}
