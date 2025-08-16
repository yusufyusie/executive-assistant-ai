/**
 * Assistant Controller
 * Handles HTTP requests for AI assistant functionality
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';

import {
  ExecutiveAssistantService,
  AssistantRequest,
  AssistantResponse,
} from '../../../application/services/executive-assistant.service';

import {
  ProcessRequestDto,
  AssistantResponseDto,
} from '../dto/assistant.dto';

@Controller('api/assistant')
export class AssistantController {
  constructor(private readonly assistantService: ExecutiveAssistantService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  async processRequest(
    @Body(ValidationPipe) request: ProcessRequestDto,
  ): Promise<AssistantResponse> {
    const result = await this.assistantService.processRequest(request);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Get('briefing')
  @HttpCode(HttpStatus.OK)
  async getDailyBriefing(@Query('date') date?: string): Promise<any> {
    const result = await this.assistantService.generateDailyBriefing(date);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Get('capabilities')
  @HttpCode(HttpStatus.OK)
  async getCapabilities(): Promise<any> {
    return this.assistantService.getCapabilities();
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getHealth(): Promise<any> {
    const capabilities = await this.assistantService.getCapabilities();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: capabilities.status,
      features: capabilities.features,
      integrations: capabilities.integrations,
    };
  }
}
