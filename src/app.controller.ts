/**
 * Application Controller
 * Main controller for application-level endpoints
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getApplicationInfo(): any {
    return this.appService.getApiInfo();
  }

  @Get('health')
  getHealth(): any {
    return this.appService.getHealthStatus();
  }

  @Get('features')
  getFeatures(): any {
    return this.appService.getFeatures();
  }

  @Get('metrics')
  getMetrics(): any {
    return this.appService.getMetrics();
  }

  @Get('apis')
  getApiStatus(): any {
    return this.appService.getApiStatus();
  }

  @Get('test-apis')
  testApis(): any {
    return this.appService.testApis();
  }

  getApiInfo(): any {
    return this.appService.getApiInfo();
  }
}
