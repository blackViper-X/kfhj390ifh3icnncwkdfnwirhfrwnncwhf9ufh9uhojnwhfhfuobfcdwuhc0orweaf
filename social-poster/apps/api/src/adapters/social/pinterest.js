const { makeRequest } = require('../../utils/apiClient');
const logger = require('../../utils/logger');

const API_BASE = 'https://api.pinterest.com/v5';
const OAUTH_BASE = 'https://www.pinterest.com/oauth';
const TOKEN_URL = 'https://api.pinterest.com/v5/oauth/token';

async function getAuthorizationUrl(config) {
  const { clientId, redirectUri, scopes, state } = config;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes || 'boards:read,pins:read,pins:write,user_accounts:read',
    response_type: 'code',
    state,
  });

  return `${OAUTH_BASE}?${params.toString()}`;
}

async function exchangeCodeForTokens(config) {
  const { clientId, clientSecret, redirectUri, code } = config;

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await makeRequest({
    url: TOKEN_URL,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    },
    data: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
  };
}

async function refreshAccessToken(config) {
  const { clientId, clientSecret, refreshToken } = config;

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await makeRequest({
    url: TOKEN_URL,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    },
    data: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
  };
}

async function getAccountInfo(accessToken) {
  const response = await makeRequest({
    url: `${API_BASE}/user_account`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}

async function getBoards(accessToken) {
  const response = await makeRequest({
    url: `${API_BASE}/boards`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data.items || [];
}

async function publishPin(config) {
  const { accessToken, boardId, title, description, link, imageUrl, videoUrl } = config;

  const data = {
    board_id: boardId,
    title,
    description,
    link,
  };

  if (videoUrl) {
    data.media_source = {
      source_type: 'video',
      url: videoUrl,
    };
  } else if (imageUrl) {
    data.media_source = {
      source_type: 'image',
      url: imageUrl,
    };
  }

  const response = await makeRequest({
    url: `${API_BASE}/pins`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    data,
  });

  return {
    externalPostId: response.data.id,
    externalUrl: `https://www.pinterest.com/pin/${response.data.id}`,
  };
}

async function getComments(config) {
  const { accessToken, pinId } = config;

  try {
    const response = await makeRequest({
      url: `${API_BASE}/pins/${pinId}/comments`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return (response.data.items || []).map((comment) => ({
      externalCommentId: comment.id,
      authorName: comment.user?.username,
      content: comment.text,
      createdAt: new Date(comment.created_at),
    }));
  } catch (error) {
    logger.warn('Pinterest comments not available', { pinId, error: error.message });
    return [];
  }
}

async function getAnalytics(config) {
  const { accessToken, pinId, metrics, startDate, endDate } = config;

  try {
    const response = await makeRequest({
      url: `${API_BASE}/analytics/metrics`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        start_date: startDate,
        end_date: endDate,
        metric_types: metrics || 'IMPRESSION,ENGAGEMENT',
      },
    });

    return response.data.items || [];
  } catch (error) {
    logger.warn('Pinterest analytics not available', { error: error.message });
    return [];
  }
}

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getAccountInfo,
  getBoards,
  publishPin,
  getComments,
  getAnalytics,
};
