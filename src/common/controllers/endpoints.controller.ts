import { Controller, Get, Post, Query, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { EndpointConfigService } from '../services/endpoint-config.service';
import { EndpointValidatorService, ValidationResult } from '../services/endpoint-validator.service';

@Controller('api/endpoints')
export class EndpointsController {
  constructor(
    private readonly endpointConfigService: EndpointConfigService,
    private readonly endpointValidatorService: EndpointValidatorService
  ) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  async getAllEndpoints(
    @Query('category') category?: string,
    @Query('quality') minQuality?: number,
    @Query('feature') feature?: string
  ) {
    let endpoints = this.endpointConfigService.getAllEndpoints();

    // Apply filters
    if (category) {
      endpoints = endpoints.filter(e => e.category === category);
    }

    if (minQuality) {
      endpoints = endpoints.filter(e => e.quality >= Number(minQuality));
    }

    if (feature) {
      endpoints = endpoints.filter(e => e.features.includes(feature));
    }

    return {
      endpoints: endpoints.map(endpoint => ({
        path: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        category: endpoint.category,
        quality: endpoint.quality,
        qualityStars: '⭐'.repeat(endpoint.quality),
        features: endpoint.features,
        authentication: endpoint.authentication,
        rateLimit: endpoint.rateLimit,
        metadata: endpoint.metadata
      })),
      summary: {
        total: endpoints.length,
        categories: [...new Set(endpoints.map(e => e.category))],
        averageQuality: endpoints.reduce((sum, e) => sum + e.quality, 0) / endpoints.length,
        qualityDistribution: {
          excellent: endpoints.filter(e => e.quality === 5).length,
          good: endpoints.filter(e => e.quality === 4).length,
          average: endpoints.filter(e => e.quality === 3).length,
          poor: endpoints.filter(e => e.quality < 3).length
        }
      },
      filters: {
        category: category || null,
        minQuality: minQuality || null,
        feature: feature || null
      }
    };
  }

  @Get('/categories')
  @HttpCode(HttpStatus.OK)
  async getCategories() {
    const endpoints = this.endpointConfigService.getAllEndpoints();
    const categories = [...new Set(endpoints.map(e => e.category))];
    
    return {
      categories: categories.map(category => {
        const categoryEndpoints = endpoints.filter(e => e.category === category);
        return {
          name: category,
          count: categoryEndpoints.length,
          averageQuality: categoryEndpoints.reduce((sum, e) => sum + e.quality, 0) / categoryEndpoints.length,
          endpoints: categoryEndpoints.map(e => ({
            path: e.path,
            method: e.method,
            description: e.description,
            quality: e.quality
          }))
        };
      }),
      total: categories.length
    };
  }

  @Get('/features')
  @HttpCode(HttpStatus.OK)
  async getFeatures() {
    const endpoints = this.endpointConfigService.getAllEndpoints();
    const allFeatures = endpoints.flatMap(e => e.features);
    const uniqueFeatures = [...new Set(allFeatures)];
    
    return {
      features: uniqueFeatures.map(feature => ({
        name: feature,
        count: allFeatures.filter(f => f === feature).length,
        endpoints: endpoints
          .filter(e => e.features.includes(feature))
          .map(e => ({
            path: e.path,
            method: e.method,
            description: e.description,
            category: e.category
          }))
      })),
      total: uniqueFeatures.length
    };
  }

  @Get('/quality')
  @HttpCode(HttpStatus.OK)
  async getQualityReport() {
    const endpoints = this.endpointConfigService.getAllEndpoints();
    const totalEndpoints = endpoints.length;
    
    const qualityDistribution = {
      excellent: endpoints.filter(e => e.quality === 5),
      good: endpoints.filter(e => e.quality === 4),
      average: endpoints.filter(e => e.quality === 3),
      poor: endpoints.filter(e => e.quality < 3)
    };

    const averageQuality = endpoints.reduce((sum, e) => sum + e.quality, 0) / totalEndpoints;

    return {
      summary: {
        totalEndpoints,
        averageQuality: Math.round(averageQuality * 100) / 100,
        qualityScore: Math.round((averageQuality / 5) * 100)
      },
      distribution: {
        excellent: {
          count: qualityDistribution.excellent.length,
          percentage: Math.round((qualityDistribution.excellent.length / totalEndpoints) * 100),
          endpoints: qualityDistribution.excellent.map(e => `${e.method} ${e.path}`)
        },
        good: {
          count: qualityDistribution.good.length,
          percentage: Math.round((qualityDistribution.good.length / totalEndpoints) * 100),
          endpoints: qualityDistribution.good.map(e => `${e.method} ${e.path}`)
        },
        average: {
          count: qualityDistribution.average.length,
          percentage: Math.round((qualityDistribution.average.length / totalEndpoints) * 100),
          endpoints: qualityDistribution.average.map(e => `${e.method} ${e.path}`)
        },
        poor: {
          count: qualityDistribution.poor.length,
          percentage: Math.round((qualityDistribution.poor.length / totalEndpoints) * 100),
          endpoints: qualityDistribution.poor.map(e => `${e.method} ${e.path}`)
        }
      },
      recommendations: this.generateQualityRecommendations(endpoints)
    };
  }

  @Get('/documentation')
  @HttpCode(HttpStatus.OK)
  async getDocumentation() {
    return this.endpointConfigService.getEndpointDocumentation();
  }

  @Get('/summary')
  @HttpCode(HttpStatus.OK)
  async getSummary() {
    return this.endpointConfigService.getEndpointSummary();
  }

  @Get('/validate')
  @HttpCode(HttpStatus.OK)
  async validateAllEndpoints() {
    const results = await this.endpointValidatorService.validateAllEndpoints();
    return this.endpointValidatorService.generateValidationReport(results);
  }

  @Post('/validate/:method/:path')
  @HttpCode(HttpStatus.OK)
  async validateSpecificEndpoint(
    @Param('method') method: string,
    @Param('path') path: string,
    @Body() requestData?: any,
    @Query('expectedStatus') expectedStatus?: number
  ) {
    const decodedPath = decodeURIComponent(path);
    const result = await this.endpointValidatorService.validateEndpoint(
      method,
      decodedPath,
      requestData,
      expectedStatus ? Number(expectedStatus) : 200
    );
    
    return {
      validation: result,
      timestamp: new Date().toISOString(),
      endpoint: `${method.toUpperCase()} ${decodedPath}`
    };
  }

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  async searchEndpoints(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('method') method?: string
  ) {
    if (!query) {
      return {
        results: [],
        total: 0,
        query: null,
        message: 'Please provide a search query'
      };
    }

    let endpoints = this.endpointConfigService.getAllEndpoints();
    
    // Apply filters
    if (category) {
      endpoints = endpoints.filter(e => e.category === category);
    }
    
    if (method) {
      endpoints = endpoints.filter(e => e.method.toLowerCase() === method.toLowerCase());
    }

    // Search in path, description, and features
    const searchResults = endpoints.filter(endpoint => {
      const searchText = query.toLowerCase();
      return (
        endpoint.path.toLowerCase().includes(searchText) ||
        endpoint.description.toLowerCase().includes(searchText) ||
        endpoint.features.some(feature => feature.toLowerCase().includes(searchText)) ||
        endpoint.metadata.tags.some(tag => tag.toLowerCase().includes(searchText))
      );
    });

    return {
      results: searchResults.map(endpoint => ({
        path: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        category: endpoint.category,
        quality: endpoint.quality,
        qualityStars: '⭐'.repeat(endpoint.quality),
        features: endpoint.features,
        relevanceScore: this.calculateRelevanceScore(endpoint, query)
      })).sort((a, b) => b.relevanceScore - a.relevanceScore),
      total: searchResults.length,
      query,
      filters: {
        category: category || null,
        method: method || null
      }
    };
  }

  @Get('/stats')
  @HttpCode(HttpStatus.OK)
  async getStatistics() {
    const endpoints = this.endpointConfigService.getAllEndpoints();
    const categories = [...new Set(endpoints.map(e => e.category))];
    const methods = [...new Set(endpoints.map(e => e.method))];
    const features = [...new Set(endpoints.flatMap(e => e.features))];

    return {
      overview: {
        totalEndpoints: endpoints.length,
        totalCategories: categories.length,
        totalMethods: methods.length,
        totalFeatures: features.length,
        averageQuality: Math.round((endpoints.reduce((sum, e) => sum + e.quality, 0) / endpoints.length) * 100) / 100
      },
      methodDistribution: methods.map(method => ({
        method,
        count: endpoints.filter(e => e.method === method).length,
        percentage: Math.round((endpoints.filter(e => e.method === method).length / endpoints.length) * 100)
      })),
      categoryDistribution: categories.map(category => ({
        category,
        count: endpoints.filter(e => e.category === category).length,
        percentage: Math.round((endpoints.filter(e => e.category === category).length / endpoints.length) * 100),
        averageQuality: Math.round((endpoints.filter(e => e.category === category).reduce((sum, e) => sum + e.quality, 0) / endpoints.filter(e => e.category === category).length) * 100) / 100
      })),
      featureUsage: features.map(feature => ({
        feature,
        count: endpoints.filter(e => e.features.includes(feature)).length,
        percentage: Math.round((endpoints.filter(e => e.features.includes(feature)).length / endpoints.length) * 100)
      })).sort((a, b) => b.count - a.count).slice(0, 10), // Top 10 features
      qualityMetrics: {
        highQuality: endpoints.filter(e => e.quality >= 4).length,
        mediumQuality: endpoints.filter(e => e.quality === 3).length,
        lowQuality: endpoints.filter(e => e.quality < 3).length,
        excellentPercentage: Math.round((endpoints.filter(e => e.quality === 5).length / endpoints.length) * 100)
      }
    };
  }

  @Get('/health')
  @HttpCode(HttpStatus.OK)
  async getEndpointHealth() {
    const endpoints = this.endpointConfigService.getAllEndpoints();
    const healthyEndpoints = endpoints.filter(e => e.quality >= 4);
    const unhealthyEndpoints = endpoints.filter(e => e.quality < 3);
    
    return {
      status: unhealthyEndpoints.length === 0 ? 'healthy' : 'degraded',
      summary: {
        total: endpoints.length,
        healthy: healthyEndpoints.length,
        unhealthy: unhealthyEndpoints.length,
        healthPercentage: Math.round((healthyEndpoints.length / endpoints.length) * 100)
      },
      healthyEndpoints: healthyEndpoints.map(e => `${e.method} ${e.path}`),
      unhealthyEndpoints: unhealthyEndpoints.map(e => ({
        endpoint: `${e.method} ${e.path}`,
        quality: e.quality,
        issues: this.identifyQualityIssues(e)
      })),
      recommendations: unhealthyEndpoints.length > 0 ? [
        'Review and improve low-quality endpoints',
        'Add missing documentation and examples',
        'Implement proper error handling',
        'Add comprehensive validation'
      ] : ['All endpoints are healthy!']
    };
  }

  private generateQualityRecommendations(endpoints: any[]): string[] {
    const recommendations: string[] = [];
    const lowQualityEndpoints = endpoints.filter(e => e.quality < 4);
    
    if (lowQualityEndpoints.length > 0) {
      recommendations.push(`Improve ${lowQualityEndpoints.length} low-quality endpoints`);
    }
    
    const missingExamples = endpoints.filter(e => !e.examples || (!e.examples.request && !e.examples.response));
    if (missingExamples.length > 0) {
      recommendations.push(`Add examples to ${missingExamples.length} endpoints`);
    }
    
    const missingFeatures = endpoints.filter(e => !e.features || e.features.length === 0);
    if (missingFeatures.length > 0) {
      recommendations.push(`Document features for ${missingFeatures.length} endpoints`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All endpoints meet quality standards!');
    }
    
    return recommendations;
  }

  private calculateRelevanceScore(endpoint: any, query: string): number {
    const searchText = query.toLowerCase();
    let score = 0;
    
    // Path match (highest weight)
    if (endpoint.path.toLowerCase().includes(searchText)) {
      score += 10;
    }
    
    // Description match
    if (endpoint.description.toLowerCase().includes(searchText)) {
      score += 5;
    }
    
    // Feature match
    if (endpoint.features.some(feature => feature.toLowerCase().includes(searchText))) {
      score += 3;
    }
    
    // Tag match
    if (endpoint.metadata.tags.some(tag => tag.toLowerCase().includes(searchText))) {
      score += 2;
    }
    
    // Quality bonus
    score += endpoint.quality;
    
    return score;
  }

  private identifyQualityIssues(endpoint: any): string[] {
    const issues: string[] = [];
    
    if (!endpoint.description || endpoint.description.length < 20) {
      issues.push('Insufficient description');
    }
    
    if (!endpoint.features || endpoint.features.length === 0) {
      issues.push('No features documented');
    }
    
    if (!endpoint.examples || (!endpoint.examples.request && !endpoint.examples.response)) {
      issues.push('Missing examples');
    }
    
    if (!endpoint.validation || !endpoint.validation.requestSchema) {
      issues.push('No request validation');
    }
    
    if (endpoint.quality < 3) {
      issues.push('Low quality rating');
    }
    
    return issues;
  }
}
