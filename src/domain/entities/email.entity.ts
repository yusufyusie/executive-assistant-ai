/**
 * Email Entity - Domain Layer
 * Core business logic for email management
 */

import { AggregateRoot } from '../common/aggregate-root';
import { Email as EmailAddress } from '../common/value-objects';
import { EmailSentEvent, EmailFailedEvent } from '../common/domain-events';

export interface EmailRecipient {
  email: EmailAddress;
  name?: string;
  type: 'to' | 'cc' | 'bcc';
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  contentType: string;
  size: number; // in bytes
}

export interface EmailProps {
  subject: string;
  body: string;
  sender: EmailAddress;
  recipients: EmailRecipient[];
  attachments?: EmailAttachment[];
  isHtml?: boolean;
  priority?: 'low' | 'normal' | 'high';
  templateId?: string;
  templateVariables?: Record<string, any>;
  scheduledAt?: Date;
  replyTo?: EmailAddress;
  tags?: string[];
}

export class EmailMessage extends AggregateRoot {
  private _subject: string;
  private _body: string;
  private _sender: EmailAddress;
  private _recipients: EmailRecipient[];
  private _attachments: EmailAttachment[];
  private _isHtml: boolean;
  private _priority: 'low' | 'normal' | 'high';
  private _templateId?: string;
  private _templateVariables?: Record<string, any>;
  private _scheduledAt?: Date;
  private _replyTo?: EmailAddress;
  private _tags: string[];
  private _status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  private _sentAt?: Date;
  private _failureReason?: string;
  private _externalId?: string; // ID from email service provider
  private _deliveryStatus?: 'delivered' | 'bounced' | 'spam' | 'unknown';

  constructor(id: string, props: EmailProps, createdAt?: Date) {
    super(id, createdAt);
    this.validateEmailProps(props);
    
    this._subject = props.subject;
    this._body = props.body;
    this._sender = props.sender;
    this._recipients = props.recipients;
    this._attachments = props.attachments || [];
    this._isHtml = props.isHtml || false;
    this._priority = props.priority || 'normal';
    this._templateId = props.templateId;
    this._templateVariables = props.templateVariables;
    this._scheduledAt = props.scheduledAt;
    this._replyTo = props.replyTo;
    this._tags = props.tags || [];
    this._status = props.scheduledAt ? 'scheduled' : 'draft';
  }

  // Getters
  get subject(): string {
    return this._subject;
  }

  get body(): string {
    return this._body;
  }

  get sender(): EmailAddress {
    return this._sender;
  }

  get recipients(): readonly EmailRecipient[] {
    return [...this._recipients];
  }

  get attachments(): readonly EmailAttachment[] {
    return [...this._attachments];
  }

  get isHtml(): boolean {
    return this._isHtml;
  }

  get priority(): 'low' | 'normal' | 'high' {
    return this._priority;
  }

  get templateId(): string | undefined {
    return this._templateId;
  }

  get templateVariables(): Record<string, any> | undefined {
    return this._templateVariables ? { ...this._templateVariables } : undefined;
  }

  get scheduledAt(): Date | undefined {
    return this._scheduledAt ? new Date(this._scheduledAt) : undefined;
  }

  get replyTo(): EmailAddress | undefined {
    return this._replyTo;
  }

  get tags(): readonly string[] {
    return [...this._tags];
  }

  get status(): 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled' {
    return this._status;
  }

  get sentAt(): Date | undefined {
    return this._sentAt ? new Date(this._sentAt) : undefined;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  get externalId(): string | undefined {
    return this._externalId;
  }

  get deliveryStatus(): 'delivered' | 'bounced' | 'spam' | 'unknown' | undefined {
    return this._deliveryStatus;
  }

  get totalAttachmentSize(): number {
    return this._attachments.reduce((total, attachment) => total + attachment.size, 0);
  }

  get recipientCount(): number {
    return this._recipients.length;
  }

  get isScheduled(): boolean {
    return this._status === 'scheduled' && this._scheduledAt !== undefined;
  }

  get isReadyToSend(): boolean {
    if (this._status !== 'draft' && this._status !== 'scheduled') {
      return false;
    }

    if (this._scheduledAt && this._scheduledAt > new Date()) {
      return false;
    }

    return true;
  }

  // Business methods
  private validateEmailProps(props: EmailProps): void {
    if (!props.subject.trim()) {
      throw new Error('Email subject cannot be empty');
    }

    if (!props.body.trim()) {
      throw new Error('Email body cannot be empty');
    }

    if (props.recipients.length === 0) {
      throw new Error('Email must have at least one recipient');
    }

    const toRecipients = props.recipients.filter(r => r.type === 'to');
    if (toRecipients.length === 0) {
      throw new Error('Email must have at least one "to" recipient');
    }

    // Validate attachment size (max 25MB total)
    const totalSize = (props.attachments || []).reduce((total, att) => total + att.size, 0);
    if (totalSize > 25 * 1024 * 1024) {
      throw new Error('Total attachment size cannot exceed 25MB');
    }

    if (props.scheduledAt && props.scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }
  }

  public updateSubject(newSubject: string): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot update subject of non-draft email');
    }

    if (!newSubject.trim()) {
      throw new Error('Email subject cannot be empty');
    }

    this._subject = newSubject.trim();
    this.markAsUpdated();
  }

  public updateBody(newBody: string): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot update body of non-draft email');
    }

    if (!newBody.trim()) {
      throw new Error('Email body cannot be empty');
    }

    this._body = newBody.trim();
    this.markAsUpdated();
  }

  public addRecipient(recipient: EmailRecipient): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot add recipients to non-draft email');
    }

    const existingRecipient = this._recipients.find(
      r => r.email.equals(recipient.email) && r.type === recipient.type
    );

    if (existingRecipient) {
      throw new Error(`Recipient ${recipient.email.value} already exists as ${recipient.type}`);
    }

    this._recipients.push(recipient);
    this.markAsUpdated();
  }

  public removeRecipient(email: EmailAddress, type: 'to' | 'cc' | 'bcc'): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot remove recipients from non-draft email');
    }

    const index = this._recipients.findIndex(
      r => r.email.equals(email) && r.type === type
    );

    if (index !== -1) {
      this._recipients.splice(index, 1);
      this.markAsUpdated();

      // Ensure at least one "to" recipient remains
      const toRecipients = this._recipients.filter(r => r.type === 'to');
      if (toRecipients.length === 0) {
        throw new Error('Email must have at least one "to" recipient');
      }
    }
  }

  public addAttachment(attachment: EmailAttachment): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot add attachments to non-draft email');
    }

    const newTotalSize = this.totalAttachmentSize + attachment.size;
    if (newTotalSize > 25 * 1024 * 1024) {
      throw new Error('Total attachment size cannot exceed 25MB');
    }

    this._attachments.push(attachment);
    this.markAsUpdated();
  }

  public removeAttachment(filename: string): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot remove attachments from non-draft email');
    }

    const index = this._attachments.findIndex(a => a.filename === filename);
    if (index !== -1) {
      this._attachments.splice(index, 1);
      this.markAsUpdated();
    }
  }

  public schedule(scheduledAt: Date): void {
    if (this._status !== 'draft') {
      throw new Error('Can only schedule draft emails');
    }

    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    this._scheduledAt = new Date(scheduledAt);
    this._status = 'scheduled';
    this.markAsUpdated();
  }

  public unschedule(): void {
    if (this._status !== 'scheduled') {
      throw new Error('Can only unschedule scheduled emails');
    }

    this._scheduledAt = undefined;
    this._status = 'draft';
    this.markAsUpdated();
  }

  public markAsSending(): void {
    if (!this.isReadyToSend) {
      throw new Error('Email is not ready to send');
    }

    this._status = 'sending';
    this.markAsUpdated();
  }

  public markAsSent(externalId: string): void {
    if (this._status !== 'sending') {
      throw new Error('Email must be in sending status to mark as sent');
    }

    this._status = 'sent';
    this._sentAt = new Date();
    this._externalId = externalId;
    this.markAsUpdated();

    this.addDomainEvent(new EmailSentEvent(this.id, this.toJSON()));
  }

  public markAsFailed(reason: string): void {
    if (this._status !== 'sending') {
      throw new Error('Email must be in sending status to mark as failed');
    }

    this._status = 'failed';
    this._failureReason = reason;
    this.markAsUpdated();

    this.addDomainEvent(new EmailFailedEvent(this.id, reason));
  }

  public cancel(): void {
    if (this._status === 'sent' || this._status === 'failed') {
      throw new Error(`Cannot cancel ${this._status} email`);
    }

    this._status = 'cancelled';
    this.markAsUpdated();
  }

  public updateDeliveryStatus(status: 'delivered' | 'bounced' | 'spam' | 'unknown'): void {
    if (this._status !== 'sent') {
      throw new Error('Can only update delivery status of sent emails');
    }

    this._deliveryStatus = status;
    this.markAsUpdated();
  }

  public addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag || this._tags.includes(normalizedTag)) {
      return;
    }

    this._tags.push(normalizedTag);
    this.markAsUpdated();
  }

  public removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    const index = this._tags.indexOf(normalizedTag);
    
    if (index !== -1) {
      this._tags.splice(index, 1);
      this.markAsUpdated();
    }
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      subject: this._subject,
      body: this._body,
      sender: this._sender.toJSON(),
      recipients: this._recipients.map(r => ({
        email: r.email.toJSON(),
        name: r.name,
        type: r.type,
      })),
      attachments: this._attachments.map(a => ({
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
      })),
      isHtml: this._isHtml,
      priority: this._priority,
      templateId: this._templateId,
      templateVariables: this._templateVariables,
      scheduledAt: this._scheduledAt?.toISOString(),
      replyTo: this._replyTo?.toJSON(),
      tags: [...this._tags],
      status: this._status,
      sentAt: this._sentAt?.toISOString(),
      failureReason: this._failureReason,
      externalId: this._externalId,
      deliveryStatus: this._deliveryStatus,
      totalAttachmentSize: this.totalAttachmentSize,
      recipientCount: this.recipientCount,
      isScheduled: this.isScheduled,
      isReadyToSend: this.isReadyToSend,
    };
  }

  // Factory method
  public static create(props: Omit<EmailProps, 'sender' | 'recipients'> & {
    sender: string;
    recipients: Array<Omit<EmailRecipient, 'email'> & { email: string }>;
  }): EmailMessage {
    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const emailProps: EmailProps = {
      ...props,
      sender: new EmailAddress(props.sender),
      recipients: props.recipients.map(r => ({
        ...r,
        email: new EmailAddress(r.email),
      })),
    };

    return new EmailMessage(id, emailProps);
  }
}
