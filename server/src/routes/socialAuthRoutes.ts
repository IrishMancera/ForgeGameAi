import { Router } from 'express';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { getDatabase } from '../models/schema.js';
import { config } from '../config.js';
import { generateToken, refreshToken } from '../utils/jwt.js';

const router = Router();

// Helper to get or create user and return tokens
async function handleSocialUser(email: string, firstName?: string, lastName?: string) {
  const db = getDatabase();
  const cleanEmail = email.trim().toLowerCase();

  let user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

  if (!user) {
    const userId = uuid();
    await db.run(
      `INSERT INTO users (id, email, passwordHash, firstName, lastName, subscriptionPlan, role)
       VALUES (?, ?, ?, ?, ?, 'free', 'viewer')`,
      [userId, cleanEmail, 'SOCIAL_OAUTH_NO_PASSWORD', firstName || null, lastName || null]
    );
    user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  }

  if (!user) {
    throw new Error('User creation failed');
  }

  const token = generateToken(user.id, user.email);
  const refresh = refreshToken(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      subscriptionPlan: user.subscriptionPlan,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
    refreshToken: refresh,
  };
}

// Helper to construct the redirect URIs
function getRedirectUri(req: any, provider: 'google' | 'linkedin') {
  const host = req.headers.host || 'localhost:3001';
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/api/auth/social/${provider}/callback`;
}

// Helper to dynamically get the frontend URL
function getFrontendUrl(req: any) {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN;
  }
  const host = req.headers.host || 'localhost:3001';
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  
  if (host.includes('localhost:3001') || host.includes('127.0.0.1:3001')) {
    return `${protocol}://${host.replace('3001', '8443')}`;
  }
  
  return `${protocol}://${host}`;
}

// ─── GOOGLE OAUTH FLOW ────────────────────────────────────────────────────────

// GET /api/auth/social/google/redirect
router.get('/google/redirect', (req, res) => {
  const inviteToken = (req.query.inviteToken as string) || '';
  const frontendUrl = getFrontendUrl(req);

  // Mock Sandbox Bypass if Google credentials are not set
  if (!config.google.clientId) {
    console.log('[Auth] Google Client ID not configured. Bypassing to mock login.');
    const mockEmail = 'designer.google@forgegame.ai';
    const mockFirst = 'Google';
    const mockLast = 'User';

    handleSocialUser(mockEmail, mockFirst, mockLast).then((authData) => {
      const redirectUrl = `${frontendUrl}/auth?token=${authData.token}&user=${encodeURIComponent(JSON.stringify(authData.user))}&inviteToken=${inviteToken}`;
      res.redirect(redirectUrl);
    }).catch((err) => {
      res.redirect(`${frontendUrl}/auth?error=${encodeURIComponent(err.message)}`);
    });
    return;
  }

  const redirectUri = getRedirectUri(req, 'google');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${config.google.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&state=${inviteToken}`;
  
  res.redirect(googleAuthUrl);
});

// GET /api/auth/social/google/callback
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const inviteToken = (state as string) || '';
  const frontendUrl = getFrontendUrl(req);

  if (!code) {
    return res.redirect(`${frontendUrl}/auth?error=No+code+returned+from+Google`);
  }

  try {
    const redirectUri = getRedirectUri(req, 'google');
    
    // Exchange Auth Code for Access Token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const accessToken = tokenResponse.data.access_token;

    // Fetch Google User Profile
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = profileResponse.data;
    if (!profile || !profile.email) {
      throw new Error('Unable to retrieve profile email from Google');
    }

    const authData = await handleSocialUser(
      profile.email,
      profile.given_name || '',
      profile.family_name || ''
    );

    // Redirect to frontend with tokens
    const redirectUrl = `${frontendUrl}/auth?token=${authData.token}&user=${encodeURIComponent(JSON.stringify(authData.user))}&inviteToken=${inviteToken}`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[Google OAuth Error]', error.response?.data || error.message);
    res.redirect(`${frontendUrl}/auth?error=${encodeURIComponent('Google authentication failed')}`);
  }
});

// ─── LINKEDIN OAUTH FLOW ──────────────────────────────────────────────────────

// GET /api/auth/social/linkedin/redirect
router.get('/linkedin/redirect', (req, res) => {
  const inviteToken = (req.query.inviteToken as string) || '';
  const frontendUrl = getFrontendUrl(req);

  // Mock Sandbox Bypass if LinkedIn credentials are not set
  if (!config.linkedin.clientId) {
    console.log('[Auth] LinkedIn Client ID not configured. Bypassing to mock login.');
    const mockEmail = 'designer.linkedin@forgegame.ai';
    const mockFirst = 'LinkedIn';
    const mockLast = 'User';

    handleSocialUser(mockEmail, mockFirst, mockLast).then((authData) => {
      const redirectUrl = `${frontendUrl}/auth?token=${authData.token}&user=${encodeURIComponent(JSON.stringify(authData.user))}&inviteToken=${inviteToken}`;
      res.redirect(redirectUrl);
    }).catch((err) => {
      res.redirect(`${frontendUrl}/auth?error=${encodeURIComponent(err.message)}`);
    });
    return;
  }

  const redirectUri = getRedirectUri(req, 'linkedin');
  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.linkedin.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&state=${inviteToken}`;
  
  res.redirect(linkedinAuthUrl);
});

// GET /api/auth/social/linkedin/callback
router.get('/linkedin/callback', async (req, res) => {
  const { code, state } = req.query;
  const inviteToken = (state as string) || '';
  const frontendUrl = getFrontendUrl(req);

  if (!code) {
    return res.redirect(`${frontendUrl}/auth?error=No+code+returned+from+LinkedIn`);
  }

  try {
    const redirectUri = getRedirectUri(req, 'linkedin');

    // Exchange Auth Code for Access Token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        client_id: config.linkedin.clientId,
        client_secret: config.linkedin.clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch LinkedIn User Profile (OpenID Connect userinfo endpoint)
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = profileResponse.data;
    if (!profile || !profile.email) {
      throw new Error('Unable to retrieve profile email from LinkedIn');
    }

    const authData = await handleSocialUser(
      profile.email,
      profile.given_name || '',
      profile.family_name || ''
    );

    // Redirect to frontend with tokens
    const redirectUrl = `${frontendUrl}/auth?token=${authData.token}&user=${encodeURIComponent(JSON.stringify(authData.user))}&inviteToken=${inviteToken}`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[LinkedIn OAuth Error]', error.response?.data || error.message);
    res.redirect(`${frontendUrl}/auth?error=${encodeURIComponent('LinkedIn authentication failed')}`);
  }
});

export default router;
