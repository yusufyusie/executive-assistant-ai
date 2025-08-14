import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EndpointConfigService, EndpointConfig } from './endpoint-config.service';

export interface ValidationResult {
  endpoint: string;
  method: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details: ValidationDetail[];
  performance: {
    responseTime: number;
    statusCode: number;
    responseSize: number;
  };
  quality: {
    score: number;
    rating: string;
    stars: string;
  };
}

export interface ValidationDetail {
  check: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

@Injectable()
export class EndpointValidatorService {
  private readonly logger = new Logger(EndpointValidatorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly endpointConfigService: EndpointConfigService
  ) {}

  async validateEndpoint(
    method: string,
    path: string,
    requestData?: any,
    expectedStatus: number = 200
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const endpoint = this.endpointConfigService.getEndpoint(method, path);
    
    if (!endpoint) {
      return this.createFailedResult(method, path, 'Endpoint configuration not found');
    }

    const details: ValidationDetail[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Validate endpoint configuration
    const configValidation = this.validateEndpointConfiguration(endpoint);
    details.push(...configValidation.details);
    totalScore += configValidation.score;
    maxScore += configValidation.maxScore;

    // Validate request schema if provided
    if (requestData && endpoint.validation?.requestSchema) {
      const requestValidation = this.validateRequestSchema(requestData, endpoint.validation.requestSchema);
      details.push(...requestValidation.details);
      totalScore += requestValidation.score;
      maxScore += requestValidation.maxScore;
    }

    // Simulate API call for testing (in real implementation, make actual HTTP request)
    const mockResponse = await this.simulateApiCall(method, path, requestData, expectedStatus);
    
    // Validate response
    const responseValidation = this.validateResponse(mockResponse, endpoint, expectedStatus);
    details.push(...responseValidation.details);
    totalScore += responseValidation.score;
    maxScore += responseValidation.maxScore;

    // Calculate performance metrics
    const responseTime = Date.now() - startTime;
    const performance = {
      responseTime,
      statusCode: mockResponse.statusCode,
      responseSize: JSON.stringify(mockResponse.body).length
    };

    // Validate performance
    const performanceValidation = this.validatePerformance(performance, endpoint);
    details.push(...performanceValidation.details);
    totalScore += performanceValidation.score;
    maxScore += performanceValidation.maxScore;

    // Calculate quality score and rating
    const qualityScore = Math.round((totalScore / maxScore) * 100);
    const quality = this.calculateQualityRating(qualityScore);

    return {
      endpoint: path,
      method,
      passed: totalScore >= maxScore * 0.7, // 70% threshold for passing
      score: totalScore,
      maxScore,
      details,
      performance,
      quality: {
        score: qualityScore,
        rating: quality.rating,
        stars: quality.stars
      }
    };
  }

  private validateEndpointConfiguration(endpoint: EndpointConfig): { details: ValidationDetail[], score: number, maxScore: number } {
    const details: ValidationDetail[] = [];
    let score = 0;
    const maxScore = 50;

    // Check required fields
    const requiredFields = ['path', 'method', 'description', 'category', 'quality'];
    const missingFields = requiredFields.filter(field => !endpoint[field]);
    
    if (missingFields.length === 0) {
      details.push({
        check: 'Required Fields',
        passed: true,
        score: 10,
        maxScore: 10,
        message: 'All required fields are present',
        severity: 'info'
      });
      score += 10;
    } else {
      details.push({
        check: 'Required Fields',
        passed: false,
        score: 0,
        maxScore: 10,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        severity: 'error'
      });
    }

    // Check description quality
    if (endpoint.description && endpoint.description.length >= 20) {
      details.push({
        check: 'Description Quality',
        passed: true,
        score: 10,
        maxScore: 10,
        message: 'Description is comprehensive',
        severity: 'info'
      });
      score += 10;
    } else {
      details.push({
        check: 'Description Quality',
        passed: false,
        score: 5,
        maxScore: 10,
        message: 'Description should be more detailed',
        severity: 'warning'
      });
      score += 5;
    }

    // Check quality rating
    if (endpoint.quality >= 4) {
      details.push({
        check: 'Quality Rating',
        passed: true,
        score: 10,
        maxScore: 10,
        message: `High quality rating: ${endpoint.quality}/5`,
        severity: 'info'
      });
      score += 10;
    } else {
      details.push({
        check: 'Quality Rating',
        passed: false,
        score: endpoint.quality * 2,
        maxScore: 10,
        message: `Quality rating could be improved: ${endpoint.quality}/5`,
        severity: 'warning'
      });
      score += endpoint.quality * 2;
    }

    // Check features
    if (endpoint.features && endpoint.features.length > 0) {
      details.push({
        check: 'Features Documentation',
        passed: true,
        score: 10,
        maxScore: 10,
        message: `${endpoint.features.length} features documented`,
        severity: 'info'
      });
      score += 10;
    } else {
      details.push({
        check: 'Features Documentation',
        passed: false,
        score: 0,
        maxScore: 10,
        message: 'No features documented',
        severity: 'warning'
      });
    }

    // Check examples
    if (endpoint.examples && (endpoint.examples.request || endpoint.examples.response)) {
      details.push({
        check: 'Examples Provided',
        passed: true,
        score: 10,
        maxScore: 10,
        message: 'Request/response examples provided',
        severity: 'info'
      });
      score += 10;
    } else {
      details.push({
        check: 'Examples Provided',
        passed: false,
        score: 0,
        maxScore: 10,
        message: 'No examples provided',
        severity: 'warning'
      });
    }

    return { details, score, maxScore };
  }

  private validateRequestSchema(requestData: any, schema: any): { details: ValidationDetail[], score: number, maxScore: number } {
    const details: ValidationDetail[] = [];
    let score = 0;
    const maxScore = 20;

    try {
      // Basic schema validation (simplified)
      if (schema.required) {
        const missingRequired = schema.required.filter(field => !requestData[field]);
        if (missingRequired.length === 0) {
          details.push({
            check: 'Required Fields Validation',
            passed: true,
            score: 10,
            maxScore: 10,
            message: 'All required fields provided',
            severity: 'info'
          });
          score += 10;
        } else {
          details.push({
            check: 'Required Fields Validation',
            passed: false,
            score: 0,
            maxScore: 10,
            message: `Missing required fields: ${missingRequired.join(', ')}`,
            severity: 'error'
          });
        }
      }

      // Type validation
      if (schema.properties) {
        let typeErrors = 0;
        Object.keys(requestData).forEach(key => {
          const property = schema.properties[key];
          if (property && property.type) {
            const actualType = typeof requestData[key];
            const expectedType = property.type === 'array' ? 'object' : property.type;
            if (actualType !== expectedType) {
              typeErrors++;
            }
          }
        });

        if (typeErrors === 0) {
          details.push({
            check: 'Type Validation',
            passed: true,
            score: 10,
            maxScore: 10,
            message: 'All field types are correct',
            severity: 'info'
          });
          score += 10;
        } else {
          details.push({
            check: 'Type Validation',
            passed: false,
            score: Math.max(0, 10 - typeErrors * 2),
            maxScore: 10,
            message: `${typeErrors} type validation errors`,
            severity: 'error'
          });
          score += Math.max(0, 10 - typeErrors * 2);
        }
      }
    } catch (error) {
      details.push({
        check: 'Schema Validation',
        passed: false,
        score: 0,
        maxScore: 20,
        message: `Schema validation error: ${error.message}`,
        severity: 'error'
      });
    }

    return { details, score, maxScore };
  }

  private async simulateApiCall(method: string, path: string, requestData?: any, expectedStatus: number = 200): Promise<any> {
    // Simulate API response based on endpoint
    const mockResponses = {
      'GET /': {
        statusCode: 200,
        body: {
          name: 'Executive Assistant AI',
          version: '1.0.0',
          environment: 'test',
          endpoints: {}
        }
      },
      'GET /health': {
        statusCode: 200,
        body: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: { ai: 'operational', calendar: 'operational' }
        }
      },
      'POST /api/assistant/process': {
        statusCode: 200,
        body: {
          intent: 'schedule_meeting',
          confidence: 0.95,
          actions: []
        }
      },
      'GET /api/tasks': {
        statusCode: 200,
        body: {
          tasks: [],
          pagination: { total: 0, page: 1 },
          summary: {}
        }
      }
    };

    const key = `${method.toUpperCase()} ${path}`;
    return mockResponses[key] || {
      statusCode: expectedStatus,
      body: { message: 'Mock response', data: requestData }
    };
  }

  private validateResponse(response: any, endpoint: EndpointConfig, expectedStatus: number): { details: ValidationDetail[], score: number, maxScore: number } {
    const details: ValidationDetail[] = [];
    let score = 0;
    const maxScore = 30;

    // Status code validation
    if (response.statusCode === expectedStatus) {
      details.push({
        check: 'Status Code',
        passed: true,
        score: 10,
        maxScore: 10,
        message: `Correct status code: ${response.statusCode}`,
        severity: 'info'
      });
      score += 10;
    } else {
      details.push({
        check: 'Status Code',
        passed: false,
        score: 0,
        maxScore: 10,
        message: `Expected ${expectedStatus}, got ${response.statusCode}`,
        severity: 'error'
      });
    }

    // Response body validation
    if (response.body && typeof response.body === 'object') {
      details.push({
        check: 'Response Format',
        passed: true,
        score: 10,
        maxScore: 10,
        message: 'Valid JSON response',
        severity: 'info'
      });
      score += 10;
    } else {
      details.push({
        check: 'Response Format',
        passed: false,
        score: 0,
        maxScore: 10,
        message: 'Invalid or missing response body',
        severity: 'error'
      });
    }

    // Response content validation
    if (response.body && Object.keys(response.body).length > 0) {
      details.push({
        check: 'Response Content',
        passed: true,
        score: 10,
        maxScore: 10,
        message: 'Response contains data',
        severity: 'info'
      });
      score += 10;
    } else {
      details.push({
        check: 'Response Content',
        passed: false,
        score: 5,
        maxScore: 10,
        message: 'Response is empty or minimal',
        severity: 'warning'
      });
      score += 5;
    }

    return { details, score, maxScore };
  }

  private validatePerformance(performance: any, endpoint: EndpointConfig): { details: ValidationDetail[], score: number, maxScore: number } {
    const details: ValidationDetail[] = [];
    let score = 0;
    const maxScore = 30;

    // Response time validation
    if (performance.responseTime < 1000) { // < 1 second
      details.push({
        check: 'Response Time',
        passed: true,
        score: 15,
        maxScore: 15,
        message: `Excellent response time: ${performance.responseTime}ms`,
        severity: 'info'
      });
      score += 15;
    } else if (performance.responseTime < 2000) { // < 2 seconds
      details.push({
        check: 'Response Time',
        passed: true,
        score: 10,
        maxScore: 15,
        message: `Good response time: ${performance.responseTime}ms`,
        severity: 'info'
      });
      score += 10;
    } else {
      details.push({
        check: 'Response Time',
        passed: false,
        score: 5,
        maxScore: 15,
        message: `Slow response time: ${performance.responseTime}ms`,
        severity: 'warning'
      });
      score += 5;
    }

    // Response size validation
    if (performance.responseSize > 0 && performance.responseSize < 1024 * 1024) { // < 1MB
      details.push({
        check: 'Response Size',
        passed: true,
        score: 15,
        maxScore: 15,
        message: `Appropriate response size: ${performance.responseSize} bytes`,
        severity: 'info'
      });
      score += 15;
    } else if (performance.responseSize === 0) {
      details.push({
        check: 'Response Size',
        passed: false,
        score: 0,
        maxScore: 15,
        message: 'Empty response',
        severity: 'error'
      });
    } else {
      details.push({
        check: 'Response Size',
        passed: false,
        score: 5,
        maxScore: 15,
        message: `Large response size: ${performance.responseSize} bytes`,
        severity: 'warning'
      });
      score += 5;
    }

    return { details, score, maxScore };
  }

  private calculateQualityRating(score: number): { rating: string, stars: string } {
    if (score >= 90) {
      return { rating: 'Excellent', stars: '⭐⭐⭐⭐⭐' };
    } else if (score >= 80) {
      return { rating: 'Very Good', stars: '⭐⭐⭐⭐' };
    } else if (score >= 70) {
      return { rating: 'Good', stars: '⭐⭐⭐' };
    } else if (score >= 60) {
      return { rating: 'Fair', stars: '⭐⭐' };
    } else {
      return { rating: 'Poor', stars: '⭐' };
    }
  }

  private createFailedResult(method: string, path: string, reason: string): ValidationResult {
    return {
      endpoint: path,
      method,
      passed: false,
      score: 0,
      maxScore: 100,
      details: [{
        check: 'Endpoint Validation',
        passed: false,
        score: 0,
        maxScore: 100,
        message: reason,
        severity: 'error'
      }],
      performance: {
        responseTime: 0,
        statusCode: 0,
        responseSize: 0
      },
      quality: {
        score: 0,
        rating: 'Failed',
        stars: ''
      }
    };
  }

  async validateAllEndpoints(): Promise<ValidationResult[]> {
    const endpoints = this.endpointConfigService.getAllEndpoints();
    const results: ValidationResult[] = [];

    for (const endpoint of endpoints) {
      try {
        const result = await this.validateEndpoint(endpoint.method, endpoint.path);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to validate endpoint ${endpoint.method} ${endpoint.path}:`, error);
        results.push(this.createFailedResult(endpoint.method, endpoint.path, error.message));
      }
    }

    return results;
  }

  generateValidationReport(results: ValidationResult[]): any {
    const totalEndpoints = results.length;
    const passedEndpoints = results.filter(r => r.passed).length;
    const averageScore = results.reduce((sum, r) => sum + r.quality.score, 0) / totalEndpoints;
    
    const qualityDistribution = {
      excellent: results.filter(r => r.quality.score >= 90).length,
      veryGood: results.filter(r => r.quality.score >= 80 && r.quality.score < 90).length,
      good: results.filter(r => r.quality.score >= 70 && r.quality.score < 80).length,
      fair: results.filter(r => r.quality.score >= 60 && r.quality.score < 70).length,
      poor: results.filter(r => r.quality.score < 60).length
    };

    return {
      summary: {
        totalEndpoints,
        passedEndpoints,
        failedEndpoints: totalEndpoints - passedEndpoints,
        successRate: Math.round((passedEndpoints / totalEndpoints) * 100),
        averageScore: Math.round(averageScore * 100) / 100,
        qualityDistribution
      },
      results,
      timestamp: new Date().toISOString()
    };
  }
}
