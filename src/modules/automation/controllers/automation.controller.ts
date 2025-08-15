/**
 * Automation Controller
 * Handles automation and scheduling operations
 */

import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AutomationService } from '../services/automation.service';

@Controller('api/automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('trigger')
  async triggerAutomation(@Body() request: any) {
    return this.automationService.triggerAutomation(request);
  }

  @Get('briefing')
  async getDailyBriefing(@Query('date') date?: string) {
    return this.automationService.generateDailyBriefing(date);
  }

  @Get('status')
  async getAutomationStatus() {
    return this.automationService.getAutomationStatus();
  }

  @Post('schedule')
  async scheduleAutomation(@Body() automationData: any) {
    return this.automationService.scheduleAutomation(automationData);
  }

  @Get('analytics')
  async getAnalytics() {
    return this.automationService.getAnalytics();
  }

  @Get('health')
  async getHealth() {
    return this.automationService.getHealth();
  }
}
