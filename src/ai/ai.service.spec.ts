import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import configuration from '../config/configuration';
import { AIRequest, ActionType } from '../common/interfaces';

describe('AIService', () => {
  let service: AIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
      ],
      providers: [AIService],
    }).compile();

    service = module.get<AIService>(AIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processRequest', () => {
    it('should process a meeting scheduling request', async () => {
      const request: AIRequest = {
        input: 'Schedule a meeting with John tomorrow at 2 PM',
        userId: 'test-user',
        timestamp: new Date(),
      };

      const response = await service.processRequest(request);

      expect(response).toHaveProperty('intent');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('response');
      expect(response).toHaveProperty('actions');
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should process an email request', async () => {
      const request: AIRequest = {
        input: 'Send an email to client@example.com about the project update',
        userId: 'test-user',
        timestamp: new Date(),
      };

      const response = await service.processRequest(request);

      expect(response.intent).toContain('email');
      expect(response.actions).toHaveLength(1);
      expect(response.actions[0].type).toBe(ActionType.SEND_EMAIL);
    });

    it('should process a task creation request', async () => {
      const request: AIRequest = {
        input: 'Create a high priority task to review the budget by Friday',
        userId: 'test-user',
        timestamp: new Date(),
      };

      const response = await service.processRequest(request);

      expect(response.intent).toContain('task');
      expect(response.actions).toHaveLength(1);
      expect(response.actions[0].type).toBe(ActionType.CREATE_TASK);
      expect(response.actions[0].parameters).toHaveProperty('priority');
    });

    it('should handle calendar search requests', async () => {
      const request: AIRequest = {
        input: 'When am I free tomorrow?',
        userId: 'test-user',
        timestamp: new Date(),
      };

      const response = await service.processRequest(request);

      expect(response.intent).toContain('search');
      expect(response.actions).toHaveLength(1);
      expect(response.actions[0].type).toBe(ActionType.SEARCH_CALENDAR);
    });

    it('should provide fallback response for unclear requests', async () => {
      const request: AIRequest = {
        input: 'xyz random text',
        userId: 'test-user',
        timestamp: new Date(),
      };

      const response = await service.processRequest(request);

      expect(response.intent).toBe('general');
      expect(response.confidence).toBeLessThan(0.8);
      expect(response.response).toContain('assistance');
    });
  });

  describe('generateDailyBriefing', () => {
    it('should generate a daily briefing', async () => {
      const context = {
        date: new Date().toDateString(),
        upcomingMeetings: [
          {
            summary: 'Team Meeting',
            start: { dateTime: new Date().toISOString() },
            end: { dateTime: new Date().toISOString() },
          },
        ],
        priorityTasks: [
          {
            title: 'Review Budget',
            priority: 'high',
            dueDate: new Date(),
          },
        ],
        importantEmails: [],
      };

      const briefing = await service.generateDailyBriefing(context);

      expect(briefing).toBeDefined();
      expect(typeof briefing).toBe('string');
      expect(briefing.length).toBeGreaterThan(0);
    });

    it('should handle empty context gracefully', async () => {
      const context = {};

      const briefing = await service.generateDailyBriefing(context);

      expect(briefing).toBeDefined();
      expect(typeof briefing).toBe('string');
      expect(briefing).toContain('Daily Briefing');
    });
  });

  describe('parameter extraction', () => {
    it('should extract meeting parameters correctly', () => {
      const input = 'Schedule a meeting with John Smith tomorrow at 3:30 PM for 1 hour';
      
      // Access private method for testing (in real implementation, test through public interface)
      const params = (service as any).extractMeetingParameters(input);

      expect(params).toHaveProperty('title');
      expect(params).toHaveProperty('time');
      expect(params).toHaveProperty('date');
      expect(params.time).toContain('3:30');
    });

    it('should extract email parameters correctly', () => {
      const input = 'Send an email to john@example.com about the quarterly review';
      
      const params = (service as any).extractEmailParameters(input);

      expect(params).toHaveProperty('to');
      expect(params.to).toBe('john@example.com');
      expect(params).toHaveProperty('subject');
    });

    it('should extract task parameters correctly', () => {
      const input = 'Create an urgent task to prepare presentation by Monday';
      
      const params = (service as any).extractTaskParameters(input);

      expect(params).toHaveProperty('title');
      expect(params).toHaveProperty('priority');
      expect(params.priority).toBe('urgent');
      expect(params).toHaveProperty('dueDate');
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock a scenario where Gemini API fails
      const originalModel = (service as any).model;
      (service as any).model = null;

      const request: AIRequest = {
        input: 'test request',
        userId: 'test-user',
        timestamp: new Date(),
      };

      const response = await service.processRequest(request);

      expect(response).toBeDefined();
      expect(response.intent).toBe('general');
      expect(response.context).toHaveProperty('fallback');

      // Restore original model
      (service as any).model = originalModel;
    });
  });
});
