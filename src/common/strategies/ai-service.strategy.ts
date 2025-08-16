/**
 * Generic AI Service Strategy Pattern
 * Enterprise-grade configurable AI service abstraction
 */

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseConfigurableService, ServiceConfiguration, ServiceStatus } from '../factories/service.factory';

/**
 * AI Service configuration interface
 */
export interface AIServiceConfiguration extends ServiceConfiguration {
  provider: 'gemini' | 'openai' | 'claude' | 'custom';
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  streaming?: boolean;
  safety?: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high';
    categories: string[];
  };
}

/**
 * AI request interface
 */
export interface AIRequest {
  prompt: string;
  context?: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
}

/**
 * AI response interface
 */
export interface AIResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'safety' | 'error';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
  processingTime: number;
}

/**
 * AI service capabilities
 */
export interface AICapabilities {
  textGeneration: boolean;
  codeGeneration: boolean;
  summarization: boolean;
  translation: boolean;
  analysis: boolean;
  streaming: boolean;
  functionCalling: boolean;
  imageAnalysis: boolean;
  maxContextLength: number;
  supportedLanguages: string[];
}

/**
 * Abstract AI service strategy
 */
export abstract class AIServiceStrategy extends BaseConfigurableService<AIServiceConfiguration> {
  protected abstract capabilities: AICapabilities;

  constructor(
    configService: ConfigService,
    serviceName: string,
  ) {
    super(configService, serviceName);
  }

  /**
   * Generate AI response
   */
  abstract generateResponse(request: AIRequest): Promise<AIResponse>;

  /**
   * Generate streaming response
   */
  abstract generateStreamingResponse(
    request: AIRequest,
    onChunk: (chunk: string) => void,
  ): Promise<AIResponse>;

  /**
   * Analyze text content
   */
  abstract analyzeContent(
    content: string,
    analysisType: 'sentiment' | 'intent' | 'entities' | 'summary',
  ): Promise<any>;

  /**
   * Get service capabilities
   */
  getCapabilities(): AICapabilities {
    return this.capabilities;
  }

  /**
   * Validate request
   */
  protected validateRequest(request: AIRequest): boolean {
    if (!request.prompt || request.prompt.trim().length === 0) {
      this.logger.warn('Empty prompt provided');
      return false;
    }

    if (request.maxTokens && request.maxTokens > this.configuration.maxTokens) {
      this.logger.warn(`Requested tokens (${request.maxTokens}) exceed limit (${this.configuration.maxTokens})`);
      return false;
    }

    return true;
  }

  /**
   * Apply safety filters
   */
  protected applySafetyFilters(content: string): { safe: boolean; reason?: string } {
    if (!this.configuration.safety?.enabled) {
      return { safe: true };
    }

    // Basic safety checks (would be more sophisticated in production)
    const unsafePatterns = [
      /\b(violence|harm|illegal)\b/i,
      /\b(hate|discrimination)\b/i,
    ];

    for (const pattern of unsafePatterns) {
      if (pattern.test(content)) {
        return { safe: false, reason: 'Content violates safety guidelines' };
      }
    }

    return { safe: true };
  }

  /**
   * Calculate token usage
   */
  protected calculateTokenUsage(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Format system message
   */
  protected formatSystemMessage(request: AIRequest): string {
    const baseSystem = 'You are a helpful AI assistant for an executive assistant application.';
    
    if (request.systemMessage) {
      return `${baseSystem}\n\nAdditional instructions: ${request.systemMessage}`;
    }
    
    return baseSystem;
  }

  /**
   * Handle API errors
   */
  protected handleError(error: any, operation: string): AIResponse {
    this.logger.error(`AI service error during ${operation}:`, error.stack);
    
    return {
      content: 'I apologize, but I encountered an error processing your request. Please try again.',
      finishReason: 'error',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      processingTime: 0,
      metadata: { error: error.message },
    };
  }
}

/**
 * Gemini AI service implementation
 */
export class GeminiAIStrategy extends AIServiceStrategy {
  protected capabilities: AICapabilities = {
    textGeneration: true,
    codeGeneration: true,
    summarization: true,
    translation: true,
    analysis: true,
    streaming: false,
    functionCalling: true,
    imageAnalysis: true,
    maxContextLength: 32000,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
  };

  async initialize(config: AIServiceConfiguration): Promise<void> {
    this._configuration = config;
    this._status = ServiceStatus.READY;
    this.logger.log('Gemini AI service initialized successfully');
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.validateRequest(request)) {
        return this.handleError(new Error('Invalid request'), 'generateResponse');
      }

      // Safety check
      const safetyCheck = this.applySafetyFilters(request.prompt);
      if (!safetyCheck.safe) {
        return {
          content: 'I cannot process this request due to safety guidelines.',
          finishReason: 'safety',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          processingTime: Date.now() - startTime,
        };
      }

      // Mock response for demonstration
      const mockResponse = this.generateMockResponse(request);
      const processingTime = Date.now() - startTime;

      this.updateMetrics(processingTime, false);
      
      return {
        ...mockResponse,
        processingTime,
      };
    } catch (error) {
      this.updateMetrics(Date.now() - startTime, true);
      return this.handleError(error, 'generateResponse');
    }
  }

  async generateStreamingResponse(
    request: AIRequest,
    onChunk: (chunk: string) => void,
  ): Promise<AIResponse> {
    // Streaming not implemented for Gemini in this demo
    return this.generateResponse(request);
  }

  async analyzeContent(
    content: string,
    analysisType: 'sentiment' | 'intent' | 'entities' | 'summary',
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Mock analysis based on type
      let result: any;
      
      switch (analysisType) {
        case 'sentiment':
          result = { sentiment: 'positive', confidence: 0.85, score: 0.7 };
          break;
        case 'intent':
          result = { intent: 'schedule_meeting', confidence: 0.92, entities: [] };
          break;
        case 'entities':
          result = { entities: [{ type: 'PERSON', text: 'John', confidence: 0.95 }] };
          break;
        case 'summary':
          result = { summary: content.substring(0, 100) + '...', length: content.length };
          break;
        default:
          result = { error: 'Unknown analysis type' };
      }

      this.updateMetrics(Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.updateMetrics(Date.now() - startTime, true);
      throw error;
    }
  }

  protected async checkDependencies(): Promise<Record<string, boolean>> {
    return {
      apiKey: !!this.configuration.apiKey,
      network: true, // Would check actual network connectivity
      rateLimit: true, // Would check rate limit status
    };
  }

  private generateMockResponse(request: AIRequest): Omit<AIResponse, 'processingTime'> {
    const responses = [
      "I'll help you with that task. Let me process your request and provide a comprehensive response.",
      "Based on your input, I can assist you with scheduling, email management, or task prioritization.",
      "I understand you need help with executive assistant tasks. I'm ready to assist you efficiently.",
      "Let me analyze your request and provide you with the most appropriate solution.",
    ];

    const content = responses[Math.floor(Math.random() * responses.length)];
    const promptTokens = this.calculateTokenUsage(request.prompt);
    const completionTokens = this.calculateTokenUsage(content);

    return {
      content,
      finishReason: 'stop',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }
}

/**
 * AI Service Strategy Factory
 */
export class AIServiceStrategyFactory {
  private static strategies = new Map<string, typeof AIServiceStrategy>();

  static register(provider: string, strategyClass: typeof AIServiceStrategy): void {
    this.strategies.set(provider, strategyClass);
  }

  static async create(
    provider: string,
    configService: ConfigService,
    config: AIServiceConfiguration,
  ): Promise<AIServiceStrategy> {
    const StrategyClass = this.strategies.get(provider);
    if (!StrategyClass) {
      throw new Error(`AI service strategy not found for provider: ${provider}`);
    }

    const strategy = new (StrategyClass as any)(configService, `${provider}AIService`);
    await strategy.initialize(config);
    return strategy;
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.strategies.keys());
  }
}

// Register default strategies
AIServiceStrategyFactory.register('gemini', GeminiAIStrategy);
