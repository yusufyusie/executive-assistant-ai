import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('API Info', () => {
    it('should return API information', () => {
      const result = appController.getApiInfo();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('endpoints');
      expect(result.status).toBe('operational');
    });
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result.status).toBe('healthy');
    });
  });

  describe('Features', () => {
    it('should return feature information', () => {
      const result = appController.getFeatures();
      expect(result).toHaveProperty('aiAssistant');
      expect(result).toHaveProperty('calendarManagement');
      expect(result).toHaveProperty('emailAutomation');
      expect(result).toHaveProperty('taskManagement');
      expect(result).toHaveProperty('proactiveAutomation');
    });
  });
});
