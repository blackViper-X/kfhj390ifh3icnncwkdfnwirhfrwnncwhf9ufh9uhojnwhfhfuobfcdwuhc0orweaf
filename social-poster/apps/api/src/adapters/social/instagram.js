const { makeRequest } = require('../../utils/apiClient');
const logger = require('../../utils/logger');

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

async function getAuthorizationUrl(config) {
  const { clientId, redirectUri, scopes, state } = config;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes || 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
    response_type: 'code',
    state,
  });

  return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
}

async function exchangeCodeForTokens(config) {
  const { clientId, clientSecret, redirectUri, code } = config;

  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/oauth/access_token`,
    method: 'GET',
    params: {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    },
  });

  const longLivedResponse = await makeRequest({
    url: `${GRAPH_API_BASE}/oauth/access_token`,
    method: 'GET',
    params: {
      grant_type: 'fb_exchange_token',
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: response.data.access_token,
    },
  });

  return {
    accessToken: longLivedResponse.data.access_token,
    refreshToken: null,
    expiresAt: new Date(Date.now() + (longLivedResponse.data.expires_in || 5184000) * 1000),
  };
}

async function refreshAccessToken(config) {
  const { clientId, clientSecret, accessToken } = config;

  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/oauth/access_token`,
    method: 'GET',
    params: {
      grant_type: 'fb_exchange_token',
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: accessToken,
    },
  });

  return {
    accessToken: response.data.access_token,
    refreshToken: null,
    expiresAt: new Date(Date.now() + (response.data.expires_in || 5184000) * 1000),
  };
}

async function getInstagramBusinessAccount(accessToken, pageId) {
  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/${pageId}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      fields: 'instagram_business_account{id,username}',
    },
  });

  return response.data.instagram_business_account;
}

async function publishPost(config) {
  const { accessToken, instagramAccountId, caption, imageUrl, videoUrl, isReel } = config;

  const containerData = {
    caption,
  };

  if (videoUrl || isReel) {
    containerData.video_url = videoUrl;
    containerData.media_type = 'REELS';
  } else if (imageUrl) {
    containerData.image_url = imageUrl;
  }

  const containerResponse = await makeRequest({
    url: `${GRAPH_API_BASE}/${instagramAccountId}/media`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: containerData,
  });

  const publishResponse = await makeRequest({
    url: `${GRAPH_API_BASE}/${instagramAccountId}/media_publish`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      creation_id: containerResponse.data.id,
    },
  });

  return {
    externalPostId: publishResponse.data.id,
    externalUrl: `https://www.instagram.com/p/${publishResponse.data.id}`,
  };
}

async function getComments(config) {
  const { accessToken, mediaId } = config;

  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/${mediaId}/comments`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      fields: 'id,text,username,timestamp',
    },
  });

  return response.data.data.map((comment) => ({
    externalCommentId: comment.id,
    authorName: comment.username,
    content: comment.text,
    createdAt: new Date(comment.timestamp),
  }));
}

async function replyToComment(config) {
  const { accessToken, commentId, message } = config;

  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/${commentId}/replies`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: { message },
  });

  return { externalReplyId: response.data.id };
}

async function getAnalytics(config) {
  const { accessToken, instagramAccountId, metrics, period } = config;

  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/${instagramAccountId}/insights`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      metric: metrics || 'impressions,reach,profile_views',
      period: period || 'day',
    },
  });

  return response.data.data;
}

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getInstagramBusinessAccount,
  publishPost,
  getComments,
  replyToComment,
  getAnalytics,
};
