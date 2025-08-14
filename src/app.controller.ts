import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getApiInfo(): any {
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
}
