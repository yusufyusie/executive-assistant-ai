/**
 * Authentication Controller - Presentation Layer
 * Handles Google OAuth authentication flow
 */

import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { GoogleOAuthService } from '../../../infrastructure/external-services/google-oauth/google-oauth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly googleOAuth: GoogleOAuthService) {}

  @Get('google')
  @ApiOperation({
    summary: 'Initiate Google OAuth flow',
    description: 'Redirects user to Google OAuth consent screen for authentication.',
  })
  @ApiQuery({
    name: 'redirect',
    required: false,
    description: 'URL to redirect to after successful authentication',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent screen',
  })
  async googleAuth(@Query('redirect') redirectUrl?: string, @Res() res?: Response) {
    try {
      const state = redirectUrl ? Buffer.from(redirectUrl).toString('base64') : undefined;
      const authUrl = this.googleOAuth.getAuthorizationUrl(state);
      
      this.logger.log('Initiating Google OAuth flow');
      
      if (res) {
        return res.redirect(authUrl);
      }
      
      return { authUrl, message: 'Redirect to this URL to authenticate with Google' };
    } catch (error) {
      this.logger.error('Failed to initiate Google OAuth', error.stack);
      throw error;
    }
  }

  @Get('google/callback')
  @ApiOperation({
    summary: 'Handle Google OAuth callback',
    description: 'Processes the OAuth callback from Google and exchanges code for tokens.',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Authorization code from Google',
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'State parameter for redirect URL',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            picture: { type: 'string' },
          },
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
      },
    },
  })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state?: string,
    @Res() res?: Response
  ) {
    try {
      if (!code) {
        throw new Error('Authorization code not provided');
      }

      this.logger.log('Processing Google OAuth callback');

      // Exchange code for tokens
      const tokens = await this.googleOAuth.exchangeCodeForTokens(code);
      
      // Get user profile
      const userProfile = await this.googleOAuth.getUserProfile(tokens.accessToken);

      const result = {
        success: true,
        message: 'Authentication successful',
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          picture: userProfile.picture,
          verified: userProfile.verified,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: tokens.tokenType,
        },
        timestamp: new Date().toISOString(),
      };

      // Handle redirect if state parameter is provided
      if (state && res) {
        try {
          const redirectUrl = Buffer.from(state, 'base64').toString();
          const urlWithParams = new URL(redirectUrl);
          urlWithParams.searchParams.set('auth', 'success');
          urlWithParams.searchParams.set('token', tokens.accessToken);
          
          return res.redirect(urlWithParams.toString());
        } catch (error) {
          this.logger.warn('Invalid state parameter, returning JSON response');
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Google OAuth callback failed', error.stack);
      
      const errorResult = {
        success: false,
        message: 'Authentication failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      if (res && state) {
        try {
          const redirectUrl = Buffer.from(state, 'base64').toString();
          const urlWithParams = new URL(redirectUrl);
          urlWithParams.searchParams.set('auth', 'error');
          urlWithParams.searchParams.set('message', error.message);
          
          return res.redirect(urlWithParams.toString());
        } catch (redirectError) {
          // Fall through to JSON response
        }
      }

      return errorResult;
    }
  }

  @Get('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refreshes an expired access token using the refresh token.',
  })
  @ApiQuery({
    name: 'refresh_token',
    required: true,
    description: 'Refresh token obtained during initial authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  async refreshToken(@Query('refresh_token') refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token not provided');
      }

      this.logger.log('Refreshing access token');

      const tokens = await this.googleOAuth.refreshAccessToken(refreshToken);

      return {
        success: true,
        message: 'Token refreshed successfully',
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: tokens.tokenType,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Token refresh failed', error.stack);
      
      return {
        success: false,
        message: 'Token refresh failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('logout')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Revokes the access token and logs out the user.',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Access token to revoke',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout(@Query('token') token: string) {
    try {
      if (!token) {
        throw new Error('Access token not provided');
      }

      this.logger.log('Logging out user');

      const revoked = await this.googleOAuth.revokeToken(token);

      return {
        success: revoked,
        message: revoked ? 'Logout successful' : 'Logout failed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Logout failed', error.stack);
      
      return {
        success: false,
        message: 'Logout failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get authentication status',
    description: 'Returns the current authentication configuration and status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication status retrieved successfully',
  })
  async getAuthStatus() {
    const oauthStatus = this.googleOAuth.getStatus();
    
    return {
      success: true,
      message: 'Authentication status retrieved',
      oauth: {
        configured: oauthStatus.configured,
        clientId: oauthStatus.clientId,
        scopes: oauthStatus.scopes,
        redirectUri: oauthStatus.redirectUri,
      },
      endpoints: {
        login: '/auth/google',
        callback: '/auth/google/callback',
        refresh: '/auth/refresh',
        logout: '/auth/logout',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
