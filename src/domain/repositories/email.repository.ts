/**
 * Email Repository Interface - Domain Layer
 * Contract for email data persistence
 */

import {
  Repository,
  ReadRepository,
  QueryOptions,
  QueryResult,
} from '../common/repository.interface';
import { EmailMessage } from '../entities/email.entity';

export interface EmailFilters {
  status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  sender?: string;
  recipient?: string;
  priority?: 'low' | 'normal' | 'high';
  tags?: string[];
  scheduledFrom?: Date;
  scheduledTo?: Date;
  sentFrom?: Date;
  sentTo?: Date;
  hasAttachments?: boolean;
  deliveryStatus?: 'delivered' | 'bounced' | 'spam' | 'unknown';
}

export interface EmailQueryOptions extends QueryOptions {
  filters?: EmailFilters;
}

export interface EmailRepository extends Repository<EmailMessage> {
  findByStatus(
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled',
  ): Promise<EmailMessage[]>;
  findBySender(senderEmail: string): Promise<EmailMessage[]>;
  findByRecipient(recipientEmail: string): Promise<EmailMessage[]>;
  findScheduledEmails(): Promise<EmailMessage[]>;
  findEmailsDueForSending(): Promise<EmailMessage[]>;
  findByTags(tags: string[]): Promise<EmailMessage[]>;
  findByPriority(priority: 'low' | 'normal' | 'high'): Promise<EmailMessage[]>;
  findMany(options?: EmailQueryOptions): Promise<QueryResult<EmailMessage>>;
  getEmailAnalytics(): Promise<{
    total: number;
    sent: number;
    failed: number;
    scheduled: number;
    deliveryRate: number;
    bounceRate: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  }>;
}

export interface EmailReadRepository extends ReadRepository<EmailMessage> {
  findByStatus(
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled',
  ): Promise<EmailMessage[]>;
  findBySender(senderEmail: string): Promise<EmailMessage[]>;
  findByRecipient(recipientEmail: string): Promise<EmailMessage[]>;
  findScheduledEmails(): Promise<EmailMessage[]>;
  searchEmails(query: string): Promise<EmailMessage[]>;
}
