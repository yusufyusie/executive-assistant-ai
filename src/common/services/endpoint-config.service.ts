import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EndpointConfig {
  path: string;
  method: string;
  description: string;
  category: string;
  quality: number;
  features: string[];
  rateLimit?: {
    requests: number;
    window: string;
  };
  authentication: {
    required: boolean;
    types: string[];
  };
  validation: {
    requestSchema?: any;
    responseSchema?: any;
  };
  examples: {
    request?: any;
    response?: any;
  };
  metadata: {
    version: string;
    deprecated: boolean;
    experimental: boolean;
    tags: string[];
  };
}

@Injectable()
export class EndpointConfigService {
  private readonly logger = new Logger(EndpointConfigService.name);
  private readonly endpoints: Map<string, EndpointConfig> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeEndpoints();
  }

  private initializeEndpoints(): void {
    this.logger.log('Initializing dynamic endpoint configurations...');

    // Application Core Endpoints
    this.registerEndpoint('GET /', {
      path: '/',
      method: 'GET',
      description: 'Get comprehensive application information and capabilities',
      category: 'core',
      quality: 5,
      features: ['metadata', 'discovery', 'health'],
      authentication: { required: false, types: [] },
      validation: {},
      examples: {
        response: {
          name: 'Executive Assistant AI',
          version: '1.0.0',
          endpoints: {},
          capabilities: {},
          limits: {}
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['core', 'info', 'discovery']
      }
    });

    this.registerEndpoint('GET /health', {
      path: '/health',
      method: 'GET',
      description: 'Comprehensive system health check with service status',
      category: 'core',
      quality: 5,
      features: ['health', 'monitoring', 'diagnostics'],
      authentication: { required: false, types: [] },
      validation: {},
      examples: {
        response: {
          status: 'healthy',
          timestamp: '2025-08-14T12:00:00.000Z',
          services: {}
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['health', 'monitoring', 'status']
      }
    });

    // AI Assistant Endpoints
    this.registerEndpoint('POST /api/assistant/process', {
      path: '/api/assistant/process',
      method: 'POST',
      description: 'Process natural language requests using advanced AI',
      category: 'ai',
      quality: 5,
      features: ['nlp', 'intent-recognition', 'action-planning'],
      rateLimit: { requests: 15, window: '1m' },
      authentication: { required: true, types: ['api-key'] },
      validation: {
        requestSchema: {
          type: 'object',
          required: ['input'],
          properties: {
            input: { type: 'string', minLength: 1, maxLength: 1000 },
            context: { type: 'object' },
            options: { type: 'object' }
          }
        }
      },
      examples: {
        request: {
          input: 'Schedule a meeting with the team tomorrow at 2 PM',
          context: { userId: 'exec001', timezone: 'America/New_York' }
        },
        response: {
          intent: 'schedule_meeting',
          confidence: 0.95,
          actions: []
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['ai', 'nlp', 'processing']
      }
    });

    this.registerEndpoint('GET /api/assistant/briefing', {
      path: '/api/assistant/briefing',
      method: 'GET',
      description: 'Generate AI-powered daily briefing with insights',
      category: 'ai',
      quality: 5,
      features: ['briefing', 'analytics', 'insights'],
      authentication: { required: true, types: ['api-key'] },
      validation: {},
      examples: {
        response: {
          briefing: 'Daily briefing content...',
          date: '2025-08-14T08:00:00.000Z',
          summary: {}
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['ai', 'briefing', 'daily']
      }
    });

    // Calendar Management Endpoints
    this.registerEndpoint('GET /api/calendar/events', {
      path: '/api/calendar/events',
      method: 'GET',
      description: 'Retrieve calendar events with advanced filtering',
      category: 'calendar',
      quality: 5,
      features: ['events', 'filtering', 'pagination'],
      authentication: { required: true, types: ['api-key', 'oauth'] },
      validation: {},
      examples: {
        response: {
          events: [],
          pagination: {},
          summary: {}
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['calendar', 'events', 'google']
      }
    });

    this.registerEndpoint('POST /api/calendar/schedule', {
      path: '/api/calendar/schedule',
      method: 'POST',
      description: 'Schedule new meetings with intelligent conflict resolution',
      category: 'calendar',
      quality: 5,
      features: ['scheduling', 'conflict-resolution', 'notifications'],
      authentication: { required: true, types: ['api-key', 'oauth'] },
      validation: {
        requestSchema: {
          type: 'object',
          required: ['title', 'startTime', 'endTime'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            attendees: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      examples: {
        request: {
          title: 'Team Meeting',
          startTime: '2025-08-20T14:00:00-04:00',
          endTime: '2025-08-20T15:00:00-04:00',
          attendees: ['team@company.com']
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['calendar', 'scheduling', 'meetings']
      }
    });

    // Email Automation Endpoints
    this.registerEndpoint('GET /api/email/templates', {
      path: '/api/email/templates',
      method: 'GET',
      description: 'Retrieve professional email templates',
      category: 'email',
      quality: 5,
      features: ['templates', 'categorization', 'variables'],
      authentication: { required: true, types: ['api-key'] },
      validation: {},
      examples: {
        response: {
          templates: [],
          categories: [],
          total: 0
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['email', 'templates', 'automation']
      }
    });

    this.registerEndpoint('POST /api/email/send', {
      path: '/api/email/send',
      method: 'POST',
      description: 'Send professional emails with tracking',
      category: 'email',
      quality: 5,
      features: ['sending', 'tracking', 'analytics'],
      rateLimit: { requests: 10, window: '1m' },
      authentication: { required: true, types: ['api-key'] },
      validation: {
        requestSchema: {
          type: 'object',
          required: ['to', 'subject', 'content'],
          properties: {
            to: { type: 'array', items: { type: 'string', format: 'email' } },
            subject: { type: 'string', minLength: 1, maxLength: 200 },
            content: { type: 'string', minLength: 1 }
          }
        }
      },
      examples: {
        request: {
          to: ['recipient@company.com'],
          subject: 'Meeting Confirmation',
          content: '<p>Your meeting has been confirmed.</p>'
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['email', 'sending', 'communication']
      }
    });

    // Task Management Endpoints
    this.registerEndpoint('GET /api/tasks', {
      path: '/api/tasks',
      method: 'GET',
      description: 'Retrieve tasks with intelligent filtering and prioritization',
      category: 'tasks',
      quality: 5,
      features: ['filtering', 'prioritization', 'analytics'],
      authentication: { required: true, types: ['api-key'] },
      validation: {},
      examples: {
        response: {
          tasks: [],
          pagination: {},
          summary: {}
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['tasks', 'management', 'productivity']
      }
    });

    this.registerEndpoint('POST /api/tasks', {
      path: '/api/tasks',
      method: 'POST',
      description: 'Create intelligent tasks with AI categorization',
      category: 'tasks',
      quality: 5,
      features: ['creation', 'ai-categorization', 'reminders'],
      authentication: { required: true, types: ['api-key'] },
      validation: {
        requestSchema: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            description: { type: 'string', maxLength: 2000 },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            dueDate: { type: 'string', format: 'date-time' }
          }
        }
      },
      examples: {
        request: {
          title: 'Review Q4 Budget',
          description: 'Comprehensive review of Q4 budget allocations',
          priority: 'high',
          dueDate: '2025-08-25T17:00:00-04:00'
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['tasks', 'creation', 'ai']
      }
    });

    // Automation Endpoints
    this.registerEndpoint('GET /api/automation/briefing', {
      path: '/api/automation/briefing',
      method: 'GET',
      description: 'Get comprehensive daily briefing with automation insights',
      category: 'automation',
      quality: 5,
      features: ['briefing', 'automation', 'insights'],
      authentication: { required: true, types: ['api-key'] },
      validation: {},
      examples: {
        response: {
          date: '2025-08-14T08:00:00.000Z',
          upcomingMeetings: [],
          priorityTasks: [],
          suggestions: []
        }
      },
      metadata: {
        version: '1.0.0',
        deprecated: false,
        experimental: false,
        tags: ['automation', 'briefing', 'proactive']
      }
    });

    this.logger.log(`Initialized ${this.endpoints.size} endpoint configurations`);
  }

  private registerEndpoint(key: string, config: EndpointConfig): void {
    this.endpoints.set(key, config);
  }

  getEndpoint(method: string, path: string): EndpointConfig | undefined {
    const key = `${method.toUpperCase()} ${path}`;
    return this.endpoints.get(key);
  }

  getAllEndpoints(): EndpointConfig[] {
    return Array.from(this.endpoints.values());
  }

  getEndpointsByCategory(category: string): EndpointConfig[] {
    return this.getAllEndpoints().filter(endpoint => endpoint.category === category);
  }

  getEndpointsByQuality(minQuality: number): EndpointConfig[] {
    return this.getAllEndpoints().filter(endpoint => endpoint.quality >= minQuality);
  }

  getEndpointsByFeature(feature: string): EndpointConfig[] {
    return this.getAllEndpoints().filter(endpoint => 
      endpoint.features.includes(feature)
    );
  }

  getEndpointSummary(): any {
    const endpoints = this.getAllEndpoints();
    const categories = [...new Set(endpoints.map(e => e.category))];
    const totalEndpoints = endpoints.length;
    const averageQuality = endpoints.reduce((sum, e) => sum + e.quality, 0) / totalEndpoints;
    
    const categoryStats = categories.map(category => ({
      category,
      count: endpoints.filter(e => e.category === category).length,
      averageQuality: endpoints
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.quality, 0) / 
        endpoints.filter(e => e.category === category).length
    }));

    return {
      totalEndpoints,
      averageQuality: Math.round(averageQuality * 100) / 100,
      categories: categoryStats,
      qualityDistribution: {
        excellent: endpoints.filter(e => e.quality === 5).length,
        good: endpoints.filter(e => e.quality === 4).length,
        average: endpoints.filter(e => e.quality === 3).length,
        poor: endpoints.filter(e => e.quality < 3).length
      }
    };
  }

  validateEndpointConfig(config: EndpointConfig): boolean {
    const required = ['path', 'method', 'description', 'category', 'quality'];
    return required.every(field => config[field] !== undefined);
  }

  updateEndpointQuality(method: string, path: string, quality: number): boolean {
    const key = `${method.toUpperCase()} ${path}`;
    const endpoint = this.endpoints.get(key);
    
    if (endpoint && quality >= 1 && quality <= 5) {
      endpoint.quality = quality;
      this.endpoints.set(key, endpoint);
      return true;
    }
    
    return false;
  }

  getEndpointDocumentation(): any {
    const endpoints = this.getAllEndpoints();
    
    return {
      title: 'Executive Assistant AI - API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Executive Assistant AI',
      baseUrl: this.configService.get('app.baseUrl'),
      authentication: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      endpoints: endpoints.map(endpoint => ({
        path: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        category: endpoint.category,
        quality: '⭐'.repeat(endpoint.quality),
        features: endpoint.features,
        authentication: endpoint.authentication,
        rateLimit: endpoint.rateLimit,
        examples: endpoint.examples,
        metadata: endpoint.metadata
      })),
      summary: this.getEndpointSummary()
    };
  }
}
