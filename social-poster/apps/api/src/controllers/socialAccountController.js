const socialAccountService = require('../services/socialAccountService');
const platformConfigService = require('../services/platformConfigService');
const { getAdapter } = require('../adapters/social');
const { generateOAuthState, verifyOAuthState } = require('../adapters/social/oauthState');
const config = require('../config');
const { badRequest, notFound } = require('../utils/errors');
const { logAudit } = require('../services/auditService');
const logger = require('../utils/logger');

async function getSocialAccounts(req, res, next) {
  try {
    const accounts = await socialAccountService.getSocialAccounts(req.params.id);
    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
}

async function connectSocialAccount(req, res, next) {
  try {
    const companyId = req.params.id;
    const { platform } = req.params;

    const platformConfig = await platformConfigService.getDecryptedConfig(companyId, platform);

    const state = generateOAuthState(companyId, platform);

    const adapter = getAdapter(platform);
    const authUrl = await adapter.getAuthorizationUrl({
      clientId: platformConfig.clientId,
      redirectUri: platformConfig.redirectUri,
      scopes: platformConfig.scopes,
      state,
    });

    res.json({ success: true, data: { authUrl } });
  } catch (error) {
    next(error);
  }
}

async function oauthCallback(req, res, next) {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      logger.error('OAuth error from platform', { oauthError });
      return res.redirect(`${config.webUrl}/social-accounts?error=${oauthError}`);
    }

    if (!code || !state) {
      return res.redirect(`${config.webUrl}/social-accounts?error=missing_params`);
    }

    const stateData = verifyOAuthState(state);
    const { companyId, platform } = stateData;

    const platformConfig = await platformConfigService.getDecryptedConfig(companyId, platform);
    const adapter = getAdapter(platform);

    const tokens = await adapter.exchangeCodeForTokens({
      clientId: platformConfig.clientId,
      clientSecret: platformConfig.clientSecret,
      redirectUri: platformConfig.redirectUri,
      code,
    });

    const accountInfo = await adapter.getAccountInfo(tokens.accessToken);

    let platformAccountId;
    let accountName;

    if (platform === 'FACEBOOK' || platform === 'INSTAGRAM') {
      if (accountInfo.accounts && accountInfo.accounts.data && accountInfo.accounts.data.length > 0) {
        const page = accountInfo.accounts.data[0];
        platformAccountId = page.id;
        accountName = page.name;

        if (platform === 'INSTAGRAM' && page.instagram_business_account) {
          platformAccountId = page.instagram_business_account.id;
          accountName = page.instagram_business_account.username;
        }
      }
    } else if (platform === 'YOUTUBE' || platform === 'YOUTUBE_SHORTS') {
      platformAccountId = accountInfo.id;
      accountName = accountInfo.snippet?.title;
    } else if (platform === 'PINTEREST') {
      platformAccountId = accountInfo.username;
      accountName = accountInfo.username;
    }

    const socialAccount = await socialAccountService.createOrUpdateSocialAccount({
      companyId,
      platform,
      platformAccountId,
      accountName,
      platformConfigId: platformConfig.id,
    });

    await socialAccountService.saveOAuthCredential(
      socialAccount.id,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresAt
    );

    await logAudit({
      actorId: 'system',
      companyId,
      action: 'SOCIAL_ACCOUNT_CONNECTED',
      targetType: 'SocialAccount',
      targetId: socialAccount.id,
      metadata: { platform, accountName },
      result: 'SUCCESS',
    });

    res.redirect(`${config.webUrl}/social-accounts?success=true&platform=${platform}`);
  } catch (error) {
    logger.error('OAuth callback failed', { error: error.message, stack: error.stack });
    res.redirect(`${config.webUrl}/social-accounts?error=oauth_failed`);
  }
}

async function disconnectSocialAccount(req, res, next) {
  try {
    await socialAccountService.disconnectSocialAccount(req.params.id, req.user.id);
    res.json({ success: true, message: 'Social account disconnected' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSocialAccounts,
  connectSocialAccount,
  oauthCallback,
  disconnectSocialAccount,
};
