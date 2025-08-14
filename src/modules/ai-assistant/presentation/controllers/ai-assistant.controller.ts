/**
 * AI Assistant Controller
 * REST API controller following enterprise standards
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { BaseController } from '../../../../core/common/base/base.entity';
import { IApiResponse, UUID } from '../../../../core/common/types';
import { 
  ProcessAiRequestCommand, 
  ProcessAiRequestResult,
  IProcessAiRequestCommandHandler 
} from '../../application/commands/process-ai-request.command';
import { 
  ProcessAiRequestDto, 
  ProcessAiRequestResponseDto,
  AiRequestStatusDto 
} from '../dtos/process-ai-request.dto';
import { AiRequestMapper } from '../mappers/ai-request.mapper';
import { 
  ApiEndpoint, 
  ApiSuccessResponse, 
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  RateLimit,
  Audit,
  Cache
} from '../../../../core/common/decorators';
import { JwtAuthGuard } from '../../../../core/security/guards/jwt-auth.guard';
import { RateLimitGuard } from '../../../../core/security/guards/rate-limit.guard';
import { LoggingInterceptor } from '../../../../core/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../../../../core/common/interceptors/transform.interceptor';
import { ValidationException } from '../../../../core/common/base/base.entity';

@ApiTags('AI Assistant')
@Controller('api/v1/ai-assistant')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class AiAssistantController extends BaseController {
  constructor(
    private readonly processAiRequestHandler: IProcessAiRequestCommandHandler,
    private readonly aiRequestMapper: AiRequestMapper
  ) {
    super();
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint({
    summary: 'Process AI Request',
    description: 'Process natural language input using advanced AI capabilities',
    tags: ['AI Processing'],
    auth: true
  })
  @ApiBody({ 
    type: ProcessAiRequestDto,
    description: 'AI request payload with input text and optional context'
  })
  @ApiSuccessResponse(ProcessAiRequestResponseDto, 'AI request processed successfully')
  @ApiBadRequestResponse('Invalid request payload or validation errors')
  @ApiUnauthorizedResponse('Authentication required')
  @ApiInternalServerErrorResponse('Internal server error during AI processing')
  @RateLimit({ requests: 15, window: '1m' })
  @Audit({ 
    action: 'PROCESS_AI_REQUEST', 
    resource: 'ai-assistant',
    includeRequest: true,
    includeResponse: false // Don't log AI responses for privacy
  })
  public async processRequest(
    @Body(new ValidationPipe({ 
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: true 
    })) dto: ProcessAiRequestDto
  ): Promise<IApiResponse<ProcessAiRequestResponseDto>> {
    try {
      this.logInfo('Processing AI request', { 
        inputLength: dto.input.length,
        hasContext: !!dto.context,
        priority: dto.priority 
      });

      // Map DTO to command
      const command = this.aiRequestMapper.dtoToCommand(dto);

      // Execute command
      const result = await this.processAiRequestHandler.handle(command);

      // Handle result
      if (result.isFailure()) {
        throw new ValidationException(
          result.error?.message || 'AI processing failed',
          { 
            code: result.error?.code,
            details: result.error?.details,
            requestId: result.requestId
          }
        );
      }

      // Map result to response DTO
      const responseDto = this.aiRequestMapper.resultToResponseDto(result);

      this.logInfo('AI request processed successfully', { 
        requestId: result.requestId,
        intent: result.response?.intent,
        confidence: result.response?.confidence,
        actionsCount: result.response?.actions?.length || 0
      });

      return {
        success: true,
        data: responseDto,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: result.requestId,
          version: '1.0.0',
          executionTime: result.response?.metadata?.processingTime
        }
      };

    } catch (error) {
      this.logError('Failed to process AI request', error, { dto });
      throw error;
    }
  }

  @Get('requests/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint({
    summary: 'Get AI Request Status',
    description: 'Retrieve the current status of an AI processing request',
    tags: ['AI Processing'],
    auth: true
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid',
    description: 'AI request ID'
  })
  @ApiSuccessResponse(AiRequestStatusDto, 'AI request status retrieved successfully')
  @ApiBadRequestResponse('Invalid request ID format')
  @ApiUnauthorizedResponse('Authentication required')
  @Cache(300) // Cache for 5 minutes
  public async getRequestStatus(
    @Param('id', ParseUUIDPipe) requestId: UUID
  ): Promise<IApiResponse<AiRequestStatusDto>> {
    try {
      this.logInfo('Retrieving AI request status', { requestId });

      // This would typically call a query handler
      // For now, return a mock response
      const statusDto: AiRequestStatusDto = {
        id: requestId,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processingTime: 1250
      };

      return {
        success: true,
        data: statusDto,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: requestId,
          version: '1.0.0'
        }
      };

    } catch (error) {
      this.logError('Failed to retrieve AI request status', error, { requestId });
      throw error;
    }
  }

  @Get('briefing')
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint({
    summary: 'Generate Daily Briefing',
    description: 'Generate AI-powered daily briefing with insights and recommendations',
    tags: ['AI Briefing'],
    auth: true
  })
  @ApiQuery({ 
    name: 'date', 
    type: 'string', 
    format: 'date',
    required: false,
    description: 'Date for briefing (defaults to today)'
  })
  @ApiQuery({ 
    name: 'format', 
    enum: ['summary', 'detailed', 'executive'],
    required: false,
    description: 'Briefing format level'
  })
  @ApiSuccessResponse(Object, 'Daily briefing generated successfully')
  @ApiBadRequestResponse('Invalid query parameters')
  @ApiUnauthorizedResponse('Authentication required')
  @RateLimit({ requests: 5, window: '1h' })
  @Cache(1800) // Cache for 30 minutes
  public async generateDailyBriefing(
    @Query('date') date?: string,
    @Query('format') format: 'summary' | 'detailed' | 'executive' = 'summary'
  ): Promise<IApiResponse<any>> {
    try {
      this.logInfo('Generating daily briefing', { date, format });

      // Create briefing command
      const briefingDate = date ? new Date(date) : new Date();
      
      // This would typically call a briefing service
      const briefingData = {
        date: briefingDate.toISOString().split('T')[0],
        format,
        briefing: 'AI-generated daily briefing content...',
        summary: {
          totalMeetings: 4,
          priorityTasks: 7,
          urgentItems: 2,
          estimatedWorkload: '8.5 hours',
          focusTime: '2.5 hours available'
        },
        sections: {
          schedule: {
            meetings: [],
            conflicts: [],
            suggestions: ['Block 10-11 AM for deep work']
          },
          tasks: {
            urgent: [],
            important: [],
            delegatable: []
          },
          insights: {
            productivity: 'Peak focus time: 9-11 AM',
            optimization: 'Consider moving 3 PM meeting to tomorrow',
            alerts: ['Budget review deadline in 2 days']
          }
        }
      };

      this.logInfo('Daily briefing generated successfully', { 
        date: briefingDate.toISOString().split('T')[0],
        format,
        sectionsCount: Object.keys(briefingData.sections).length
      });

      return {
        success: true,
        data: briefingData,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: require('uuid').v4(),
          version: '1.0.0'
        }
      };

    } catch (error) {
      this.logError('Failed to generate daily briefing', error, { date, format });
      throw error;
    }
  }

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint({
    summary: 'Analyze Content',
    description: 'Perform AI-powered content analysis with sentiment, action items, and insights',
    tags: ['AI Analysis'],
    auth: true
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', maxLength: 10000 },
        type: { type: 'string', enum: ['email', 'document', 'message', 'note'] },
        analysisOptions: {
          type: 'object',
          properties: {
            sentiment: { type: 'boolean' },
            actionItems: { type: 'boolean' },
            urgency: { type: 'boolean' },
            followUpSuggestions: { type: 'boolean' }
          }
        }
      },
      required: ['content', 'type']
    }
  })
  @ApiSuccessResponse(Object, 'Content analyzed successfully')
  @ApiBadRequestResponse('Invalid content or analysis options')
  @ApiUnauthorizedResponse('Authentication required')
  @RateLimit({ requests: 20, window: '1h' })
  public async analyzeContent(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) body: {
      content: string;
      type: 'email' | 'document' | 'message' | 'note';
      analysisOptions?: {
        sentiment?: boolean;
        actionItems?: boolean;
        urgency?: boolean;
        followUpSuggestions?: boolean;
      };
    }
  ): Promise<IApiResponse<any>> {
    try {
      this.logInfo('Analyzing content', { 
        contentLength: body.content.length,
        type: body.type,
        options: body.analysisOptions
      });

      // This would typically call an analysis service
      const analysisResult = {
        content: {
          type: body.type,
          length: body.content.length,
          language: 'en'
        },
        sentiment: body.analysisOptions?.sentiment ? {
          score: 0.7,
          label: 'positive',
          confidence: 0.85
        } : undefined,
        actionItems: body.analysisOptions?.actionItems ? [
          {
            text: 'Schedule follow-up meeting',
            priority: 'high',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ] : undefined,
        urgency: body.analysisOptions?.urgency ? {
          level: 'medium',
          score: 0.6,
          indicators: ['deadline mentioned', 'priority keywords']
        } : undefined,
        followUpSuggestions: body.analysisOptions?.followUpSuggestions ? [
          'Send confirmation email within 24 hours',
          'Add calendar reminder for next steps'
        ] : undefined,
        metadata: {
          processingTime: 850,
          model: 'gemini-2.0-flash-exp',
          confidence: 0.92
        }
      };

      this.logInfo('Content analysis completed', { 
        type: body.type,
        sentimentScore: analysisResult.sentiment?.score,
        actionItemsCount: analysisResult.actionItems?.length || 0,
        urgencyLevel: analysisResult.urgency?.level
      });

      return {
        success: true,
        data: analysisResult,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: require('uuid').v4(),
          version: '1.0.0',
          executionTime: analysisResult.metadata.processingTime
        }
      };

    } catch (error) {
      this.logError('Failed to analyze content', error, { 
        contentLength: body.content.length,
        type: body.type 
      });
      throw error;
    }
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint({
    summary: 'AI Service Health Check',
    description: 'Check the health status of AI processing services',
    tags: ['Health'],
    auth: false
  })
  @ApiSuccessResponse(Object, 'Health status retrieved successfully')
  public async healthCheck(): Promise<IApiResponse<any>> {
    try {
      // This would typically call the service health check
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          aiProcessing: {
            status: 'operational',
            responseTime: '1.2s',
            lastCheck: new Date().toISOString()
          },
          requestRepository: {
            status: 'operational',
            connections: 5,
            lastCheck: new Date().toISOString()
          }
        },
        metrics: {
          requestsProcessed: 1247,
          averageResponseTime: 1150,
          successRate: 98.5,
          uptime: '99.9%'
        }
      };

      return {
        success: true,
        data: healthStatus,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: require('uuid').v4(),
          version: '1.0.0'
        }
      };

    } catch (error) {
      this.logError('Health check failed', error);
      throw error;
    }
  }
}
