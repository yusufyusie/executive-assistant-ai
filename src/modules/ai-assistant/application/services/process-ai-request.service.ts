/**
 * Process AI Request Service
 * Application service implementing the command handler
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  ProcessAiRequestCommand, 
  ProcessAiRequestResult, 
  IProcessAiRequestCommandHandler 
} from '../commands/process-ai-request.command';
import { AiRequest, RequestPriority, AiResponse } from '../../domain/entities/ai-request.entity';
import { IAiRequestRepository } from '../../domain/repositories/ai-request.repository';
import { IAiService } from '../../domain/services/ai.service';
import { IEventBus } from '../../../../shared/domain/base/aggregate-root';
import { ApplicationException, ExternalServiceException } from '../../../../core/common/base/base.entity';
import { Result } from '../../../../core/common/types';
import { Measure, Retry } from '../../../../core/common/decorators';

@Injectable()
export class ProcessAiRequestService implements IProcessAiRequestCommandHandler {
  private readonly logger = new Logger(ProcessAiRequestService.name);

  constructor(
    private readonly aiRequestRepository: IAiRequestRepository,
    private readonly aiService: IAiService,
    private readonly eventBus: IEventBus,
    private readonly configService: ConfigService
  ) {}

  @Measure('info')
  @Retry(3, 1000)
  public async handle(command: ProcessAiRequestCommand): Promise<ProcessAiRequestResult> {
    this.logger.log(`Processing AI request: ${command.commandId}`);

    try {
      // Create domain entity
      const aiRequest = this.createAiRequest(command);

      // Save the request
      await this.aiRequestRepository.save(aiRequest);

      // Start processing
      aiRequest.startProcessing();
      await this.aiRequestRepository.save(aiRequest);

      // Process with AI service
      const aiResponse = await this.processWithAiService(aiRequest, command.options);

      // Complete the request
      aiRequest.completeWithResponse(aiResponse);
      await this.aiRequestRepository.save(aiRequest);

      // Publish domain events
      await this.publishDomainEvents(aiRequest);

      // Return success result
      return new ProcessAiRequestResult(
        aiRequest.id,
        'completed',
        aiResponse.value
      );

    } catch (error) {
      this.logger.error(`Failed to process AI request: ${command.commandId}`, error);
      return await this.handleError(command, error);
    }
  }

  private createAiRequest(command: ProcessAiRequestCommand): AiRequest {
    const context = {
      userId: command.context?.userId,
      sessionId: command.context?.sessionId,
      timezone: command.context?.timezone || 'UTC',
      preferences: command.context?.preferences || {},
      metadata: {
        ...command.context?.metadata,
        commandId: command.commandId,
        timestamp: command.timestamp.toISOString()
      }
    };

    return AiRequest.create(
      command.input,
      context,
      command.priority || RequestPriority.NORMAL,
      this.getMaxRetries()
    );
  }

  private async processWithAiService(
    aiRequest: AiRequest, 
    options?: any
  ): Promise<AiResponse> {
    const aiConfig = this.configService.get('externalServices.ai');
    
    const requestOptions = {
      model: options?.model || aiConfig.model,
      temperature: options?.temperature ?? aiConfig.temperature,
      maxTokens: options?.maxTokens || aiConfig.maxTokens,
      includeAlternatives: options?.includeAlternatives ?? true,
      enableFallback: options?.enableFallback ?? aiConfig.fallback.enabled,
      timeout: options?.timeout || aiConfig.timeout
    };

    const startTime = Date.now();

    try {
      const result = await this.aiService.processRequest(
        aiRequest.input.value,
        aiRequest.context.value,
        requestOptions
      );

      const processingTime = Date.now() - startTime;

      // Validate AI service result
      if (!result.success) {
        throw new ExternalServiceException(
          'AI Service',
          result.error?.message || 'Unknown error',
          { requestId: aiRequest.id, options: requestOptions }
        );
      }

      // Create AI response value object
      return AiResponse.create({
        intent: result.data.intent,
        confidence: result.data.confidence,
        response: result.data.response,
        actions: result.data.actions || [],
        alternatives: result.data.alternatives,
        metadata: {
          processingTime,
          model: requestOptions.model,
          tokens: result.data.metadata?.tokens || 0
        }
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof ExternalServiceException) {
        throw error;
      }

      throw new ExternalServiceException(
        'AI Service',
        error.message,
        { 
          requestId: aiRequest.id, 
          processingTime,
          options: requestOptions,
          originalError: error.name
        }
      );
    }
  }

  private async handleError(
    command: ProcessAiRequestCommand, 
    error: Error
  ): Promise<ProcessAiRequestResult> {
    try {
      // Try to find the request if it was created
      const existingRequest = await this.findRequestByCommandId(command.commandId);
      
      if (existingRequest) {
        // Mark as failed
        existingRequest.failWithError(
          error.message,
          this.getErrorCode(error)
        );
        await this.aiRequestRepository.save(existingRequest);
        await this.publishDomainEvents(existingRequest);

        return new ProcessAiRequestResult(
          existingRequest.id,
          'failed',
          undefined,
          {
            code: this.getErrorCode(error),
            message: error.message,
            details: error instanceof ApplicationException ? error.context : undefined
          }
        );
      }

      // If no request found, return error without request ID
      return new ProcessAiRequestResult(
        command.commandId, // Use command ID as fallback
        'failed',
        undefined,
        {
          code: this.getErrorCode(error),
          message: error.message,
          details: error instanceof ApplicationException ? error.context : undefined
        }
      );

    } catch (handlingError) {
      this.logger.error(`Error while handling error for command ${command.commandId}`, handlingError);
      
      return new ProcessAiRequestResult(
        command.commandId,
        'failed',
        undefined,
        {
          code: 'INTERNAL_ERROR',
          message: 'Internal error occurred while processing request',
          details: { originalError: error.message }
        }
      );
    }
  }

  private async findRequestByCommandId(commandId: string): Promise<AiRequest | null> {
    try {
      // This would require a repository method to find by metadata
      // For now, return null and handle gracefully
      return null;
    } catch (error) {
      this.logger.warn(`Could not find request by command ID: ${commandId}`, error);
      return null;
    }
  }

  private async publishDomainEvents(aiRequest: AiRequest): Promise<void> {
    try {
      const events = aiRequest.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventBus.publishAll(events);
        aiRequest.markEventsAsCommitted();
      }
    } catch (error) {
      this.logger.error(`Failed to publish domain events for request ${aiRequest.id}`, error);
      // Don't throw here as the main operation succeeded
    }
  }

  private getErrorCode(error: Error): string {
    if (error instanceof ApplicationException) {
      return error.code;
    }
    if (error instanceof ExternalServiceException) {
      return error.code;
    }
    return 'UNKNOWN_ERROR';
  }

  private getMaxRetries(): number {
    return this.configService.get('externalServices.ai.fallback.maxRetries', 3);
  }

  // Health check method
  public async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      // Check AI service health
      const aiServiceHealth = await this.aiService.healthCheck();
      
      // Check repository health (if applicable)
      const repositoryHealth = await this.checkRepositoryHealth();

      if (aiServiceHealth.status === 'healthy' && repositoryHealth.status === 'healthy') {
        return {
          status: 'healthy',
          details: {
            aiService: aiServiceHealth,
            repository: repositoryHealth
          }
        };
      }

      return {
        status: 'degraded',
        details: {
          aiService: aiServiceHealth,
          repository: repositoryHealth
        }
      };

    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }

  private async checkRepositoryHealth(): Promise<{ status: string; details?: any }> {
    try {
      // Simple health check - this could be more sophisticated
      return { status: 'healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: { error: error.message } 
      };
    }
  }

  // Metrics method
  public getMetrics(): Record<string, unknown> {
    return {
      service: 'ProcessAiRequestService',
      version: '1.0.0',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}
