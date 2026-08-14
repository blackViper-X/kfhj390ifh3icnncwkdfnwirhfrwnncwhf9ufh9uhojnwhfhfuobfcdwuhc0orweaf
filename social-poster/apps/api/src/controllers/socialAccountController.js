// const socialAccountService = require('../services/socialAccountService');
// const platformConfigService = require('../services/platformConfigService');
// const { getAdapter } = require('../adapters/social');
// const { generateOAuthState, verifyOAuthState } = require('../adapters/social/oauthState');
// const config = require('../config');
// const { badRequest, notFound } = require('../utils/errors');
// const { logAudit } = require('../services/auditService');
// const logger = require('../utils/logger');

// async function getSocialAccounts(req, res, next) {
//   try {
//     const accounts = await socialAccountService.getSocialAccounts(req.params.id);
//     res.json({ success: true, data: accounts });
//   } catch (error) {
//     next(error);
//   }
// }

// async function connectSocialAccount(req, res, next) {
//   try {
//     const companyId = req.params.id;
//     const { platform } = req.params;

//     const platformConfig = await platformConfigService.getDecryptedConfig(companyId, platform);

//     const state = generateOAuthState(companyId, platform);

//     const adapter = getAdapter(platform);
//     const authUrl = await adapter.getAuthorizationUrl({
//       clientId: platformConfig.clientId,
//       redirectUri: platformConfig.redirectUri,
//       scopes: platformConfig.scopes,
//       state,
//     });

//     res.json({ success: true, data: { authUrl } });
//   } catch (error) {
//     next(error);
//   }
// }

// async function oauthCallback(req, res, next) {
//   try {
//     const { code, state, error: oauthError } = req.query;

//     if (oauthError) {
//       logger.error('OAuth error from platform', { oauthError });
//       return res.redirect(`${config.webUrl}/social-accounts?error=${oauthError}`);
//     }

//     if (!code || !state) {
//       return res.redirect(`${config.webUrl}/social-accounts?error=missing_params`);
//     }

//     const stateData = verifyOAuthState(state);
//     const { companyId, platform } = stateData;

//     const platformConfig = await platformConfigService.getDecryptedConfig(companyId, platform);
//     const adapter = getAdapter(platform);

//     const tokens = await adapter.exchangeCodeForTokens({
//       clientId: platformConfig.clientId,
//       clientSecret: platformConfig.clientSecret,
//       redirectUri: platformConfig.redirectUri,
//       code,
//     });

//     const accountInfo = await adapter.getAccountInfo(tokens.accessToken);

//     let platformAccountId;
//     let accountName;

//     if (platform === 'FACEBOOK' || platform === 'INSTAGRAM') {
//       if (accountInfo.accounts && accountInfo.accounts.data && accountInfo.accounts.data.length > 0) {
//         const page = accountInfo.accounts.data[0];
//         platformAccountId = page.id;
//         accountName = page.name;

//         if (platform === 'INSTAGRAM' && page.instagram_business_account) {
//           platformAccountId = page.instagram_business_account.id;
//           accountName = page.instagram_business_account.username;
//         }
//       }
//     } else if (platform === 'YOUTUBE' || platform === 'YOUTUBE_SHORTS') {
//       platformAccountId = accountInfo.id;
//       accountName = accountInfo.snippet?.title;
//     } else if (platform === 'PINTEREST') {
//       platformAccountId = accountInfo.username;
//       accountName = accountInfo.username;
//     }

//     const socialAccount = await socialAccountService.createOrUpdateSocialAccount({
//       companyId,
//       platform,
//       platformAccountId,
//       accountName,
//       platformConfigId: platformConfig.id,
//     });

//     await socialAccountService.saveOAuthCredential(
//       socialAccount.id,
//       tokens.accessToken,
//       tokens.refreshToken,
//       tokens.expiresAt
//     );

//     await logAudit({
//       actorId: 'system',
//       companyId,
//       action: 'SOCIAL_ACCOUNT_CONNECTED',
//       targetType: 'SocialAccount',
//       targetId: socialAccount.id,
//       metadata: { platform, accountName },
//       result: 'SUCCESS',
//     });

//     res.redirect(`${config.webUrl}/social-accounts?success=true&platform=${platform}`);
//   } catch (error) {
//     logger.error('OAuth callback failed', { error: error.message, stack: error.stack });
//     res.redirect(`${config.webUrl}/social-accounts?error=oauth_failed`);
//   }
// }

// async function disconnectSocialAccount(req, res, next) {
//   try {
//     await socialAccountService.disconnectSocialAccount(req.params.id, req.user.id);
//     res.json({ success: true, message: 'Social account disconnected' });
//   } catch (error) {
//     next(error);
//   }
// }

// module.exports = {
//   getSocialAccounts,
//   connectSocialAccount,
//   oauthCallback,
//   disconnectSocialAccount,
// };


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

    const state = generateOAuthState(companyId, platform, req.user.id);

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
    const { companyId, platform, userId } = stateData;

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
      const pages = accountInfo?.accounts?.data || [];

      if (pages.length === 0) {
        throw new Error(
          'No Facebook Pages were returned for this user. The account must manage at least ' +
          'one Page and grant the pages_show_list permission.'
        );
      }

      if (platform === 'INSTAGRAM') {
        // Only Pages with a linked IG business account are usable.
        const page = pages.find((p) => p.instagram_business_account);
        if (!page) {
          throw new Error(
            'No Instagram Business account is linked to any of this user\'s Facebook Pages. ' +
            'Link an Instagram Business/Creator account to a Page and try again.'
          );
        }
        platformAccountId = page.instagram_business_account.id;
        accountName = page.instagram_business_account.username;
      } else {
        const page = pages[0];
        platformAccountId = page.id;
        accountName = page.name;
      }
    } else if (platform === 'YOUTUBE' || platform === 'YOUTUBE_SHORTS') {
      if (!accountInfo?.id) {
        throw new Error('No YouTube channel was found for this Google account.');
      }
      platformAccountId = accountInfo.id;
      accountName = accountInfo.snippet?.title;
    } else if (platform === 'PINTEREST') {
      if (!accountInfo?.username) {
        throw new Error('Pinterest did not return a username for this account.');
      }
      platformAccountId = accountInfo.username;
      accountName = accountInfo.username;
    } else {
      throw new Error(`Unsupported platform in OAuth callback: ${platform}`);
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
      // AuditLog.actorId is a FK to User; the literal 'system' string would
      // fail the constraint. The initiating user rides along in the signed state.
      actorId: userId,
      companyId,
      action: 'SOCIAL_ACCOUNT_CONNECTED',
      targetType: 'SocialAccount',
      targetId: socialAccount.id,
      metadata: { platform, accountName },
      result: 'SUCCESS',
    });

    res.redirect(`${config.webUrl}/social-accounts?success=true&platform=${platform}`);
  } catch (error) {
    logger.error('OAuth callback failed', {
      error: error.message,
      status: error.status,
      platformResponse: error.responseBody,
      stack: error.stack,
    });

    // Surface the actual reason to the UI instead of a blanket "oauth_failed".
    const reason = encodeURIComponent((error.message || 'OAuth failed').slice(0, 300));
    res.redirect(`${config.webUrl}/social-accounts?error=oauth_failed&reason=${reason}`);
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
