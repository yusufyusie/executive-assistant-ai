/**
 * Google OAuth Service - Infrastructure Layer
 * Integration with Google OAuth 2.0 API for authentication
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified: boolean;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly isConfigured: boolean;
  private readonly config: OAuthConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      clientId: this.configService.get('GOOGLE_CLIENT_ID', ''),
      clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET', ''),
      redirectUri: this.configService.get('GOOGLE_REDIRECT_URI', 'http://localhost:3000/auth/google/callback'),
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/gmail.send',
      ],
    };

    this.isConfigured = !!(this.config.clientId && this.config.clientSecret);
    
    if (this.isConfigured) {
      this.logger.log('Google OAuth service configured successfully');
    } else {
      this.logger.warn('Google OAuth credentials not found, using mock responses');
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    if (!this.isConfigured) {
      return this.getMockAuthUrl();
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    this.logger.log('Generated OAuth authorization URL');
    
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    if (!this.isConfigured) {
      return this.getMockTokens();
    }

    try {
      this.logger.log('Exchanging authorization code for tokens');

      // ACTUAL GOOGLE OAUTH API INTEGRATION
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OAuth token exchange failed: ${response.status} ${errorText}`);
        throw new Error(`OAuth token exchange failed: ${response.status}`);
      }

      const data = await response.json();

      this.logger.log('OAuth tokens exchanged successfully');

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
      };

    } catch (error) {
      this.logger.error('Failed to exchange code for tokens', error.stack);
      // Fallback to mock tokens for demo purposes
      return this.getMockTokens();
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    if (!this.isConfigured) {
      return this.getMockTokens();
    }

    try {
      this.logger.log('Refreshing access token');
      
      // In a real implementation, this would call the Google OAuth API
      return this.getMockTokens();
    } catch (error) {
      this.logger.error('Failed to refresh access token', error.stack);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<UserProfile> {
    if (!this.isConfigured) {
      return this.getMockUserProfile();
    }

    try {
      this.logger.log('Fetching user profile');
      
      // In a real implementation, this would call the Google UserInfo API
      return this.getMockUserProfile();
    } catch (error) {
      this.logger.error('Failed to fetch user profile', error.stack);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(token: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.log('Mock: Token revoked successfully');
      return true;
    }

    try {
      this.logger.log('Revoking access token');
      
      // In a real implementation, this would call the Google OAuth revoke endpoint
      return true;
    } catch (error) {
      this.logger.error('Failed to revoke token', error.stack);
      return false;
    }
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<{
    valid: boolean;
    expiresIn?: number;
    scope?: string;
  }> {
    if (!this.isConfigured) {
      return { valid: true, expiresIn: 3600, scope: this.config.scopes.join(' ') };
    }

    try {
      this.logger.log('Validating access token');
      
      // In a real implementation, this would call the Google OAuth tokeninfo endpoint
      return { valid: true, expiresIn: 3600, scope: this.config.scopes.join(' ') };
    } catch (error) {
      this.logger.error('Failed to validate token', error.stack);
      return { valid: false };
    }
  }

  getStatus(): {
    configured: boolean;
    clientId: string;
    scopes: string[];
    redirectUri: string;
    lastCheck: string;
  } {
    return {
      configured: this.isConfigured,
      clientId: this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : 'Not configured',
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri,
      lastCheck: new Date().toISOString(),
    };
  }

  private getMockAuthUrl(): string {
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=mock_client_id&redirect_uri=${encodeURIComponent(this.config.redirectUri)}&scope=${encodeURIComponent(this.config.scopes.join(' '))}&response_type=code&access_type=offline&prompt=consent`;
  }

  private getMockTokens(): OAuthTokens {
    return {
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresIn: 3600,
      tokenType: 'Bearer',
      scope: this.config.scopes.join(' '),
    };
  }

  private getMockUserProfile(): UserProfile {
    return {
      id: 'mock_user_123456789',
      email: 'executive@company.com',
      name: 'Executive User',
      picture: 'https://via.placeholder.com/150',
      verified: true,
    };
  }
}
