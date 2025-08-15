/**
 * Email DTOs - Application Layer
 * Data Transfer Objects for email operations
 */

export class CreateEmailDto {
  subject: string;
  body: string;
  sender: string; // email address
  recipients: Array<{
    email: string;
    name?: string;
    type: 'to' | 'cc' | 'bcc';
  }>;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
  isHtml?: boolean;
  priority?: 'low' | 'normal' | 'high';
  templateId?: string;
  templateVariables?: Record<string, any>;
  scheduledAt?: string; // ISO string
  replyTo?: string; // email address
  tags?: string[];
}

export class UpdateEmailDto {
  subject?: string;
  body?: string;
  recipients?: Array<{
    email: string;
    name?: string;
    type: 'to' | 'cc' | 'bcc';
  }>;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
  isHtml?: boolean;
  priority?: 'low' | 'normal' | 'high';
  templateId?: string;
  templateVariables?: Record<string, any>;
  scheduledAt?: string; // ISO string
  replyTo?: string; // email address
  tags?: string[];
}

export class EmailResponseDto {
  id: string;
  subject: string;
  body: string;
  sender: {
    email: string;
  };
  recipients: Array<{
    email: { email: string };
    name?: string;
    type: 'to' | 'cc' | 'bcc';
  }>;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  isHtml: boolean;
  priority: 'low' | 'normal' | 'high';
  templateId?: string;
  templateVariables?: Record<string, any>;
  scheduledAt?: string;
  replyTo?: {
    email: string;
  };
  tags: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: string;
  failureReason?: string;
  externalId?: string;
  deliveryStatus?: 'delivered' | 'bounced' | 'spam' | 'unknown';
  totalAttachmentSize: number;
  recipientCount: number;
  isScheduled: boolean;
  isReadyToSend: boolean;
  createdAt: string;
  updatedAt: string;
}

export class EmailFiltersDto {
  status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  sender?: string;
  recipient?: string;
  priority?: 'low' | 'normal' | 'high';
  tags?: string[];
  scheduledFrom?: string;
  scheduledTo?: string;
  sentFrom?: string;
  sentTo?: string;
  hasAttachments?: boolean;
  deliveryStatus?: 'delivered' | 'bounced' | 'spam' | 'unknown';
}

export class EmailQueryDto {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: EmailFiltersDto;
}

export class SendEmailDto {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
  priority?: 'low' | 'normal' | 'high';
  replyTo?: string;
  tags?: string[];
}

export class SendTemplateEmailDto {
  templateName: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  variables: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: string; // ISO string
  tags?: string[];
}

export class EmailTemplateDto {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    required: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  category?: string;
  isActive: boolean;
}

export class EmailAnalyticsResponseDto {
  total: number;
  sent: number;
  failed: number;
  scheduled: number;
  deliveryRate: number;
  bounceRate: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export class EmailListResponseDto {
  items: EmailResponseDto[];
  total: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
  };
}

export class EmailDeliveryStatusDto {
  emailId: string;
  externalId: string;
  status: 'delivered' | 'bounced' | 'spam' | 'unknown';
  timestamp: string;
  details?: Record<string, any>;
}
