const { makeRequest } = require('../../utils/apiClient');
const logger = require('../../utils/logger');
const fs = require('fs');

const OAUTH_BASE = 'https://oauth2.googleapis.com';
const API_BASE = 'https://www.googleapis.com/youtube/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/youtube/v3';

async function getAuthorizationUrl(config) {
  const { clientId, redirectUri, scopes, state } = config;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes || 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(config) {
  const { clientId, clientSecret, redirectUri, code } = config;

  const response = await makeRequest({
    url: `${OAUTH_BASE}/token`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: 'authorization_code',
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

  const response = await makeRequest({
    url: `${OAUTH_BASE}/token`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
  };
}

async function getAccountInfo(accessToken) {
  const response = await makeRequest({
    url: `${API_BASE}/channels`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      part: 'snippet,statistics',
      mine: true,
    },
  });

  return response.data.items?.[0] || null;
}

async function publishVideo(config) {
  const { accessToken, title, description, tags, videoFilePath, isShort, privacyStatus } = config;

  const metadata = {
    snippet: {
      title,
      description,
      tags: tags || [],
      categoryId: '22',
    },
    status: {
      privacyStatus: privacyStatus || 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  const videoBuffer = fs.readFileSync(videoFilePath);

  const response = await makeRequest({
    url: `${UPLOAD_BASE}/videos`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'video/*',
      'Content-Length': videoBuffer.length,
      'X-Upload-Content-Type': 'video/*',
      'X-Upload-Content-Length': videoBuffer.length,
    },
    params: {
      uploadType: 'resumable',
      part: 'snippet,status',
    },
    data: JSON.stringify(metadata),
    retries: 1,
  });

  const locationUrl = response.headers.location;

  const uploadResponse = await makeRequest({
    url: locationUrl,
    method: 'PUT',
    headers: {
      'Content-Type': 'video/*',
      'Content-Length': videoBuffer.length,
    },
    data: videoBuffer,
    retries: 3,
  });

  return {
    externalPostId: uploadResponse.data.id,
    externalUrl: `https://www.youtube.com/watch?v=${uploadResponse.data.id}`,
  };
}

async function getComments(config) {
  const { accessToken, videoId } = config;

  const response = await makeRequest({
    url: `${API_BASE}/commentThreads`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      part: 'snippet',
      videoId,
      maxResults: 50,
    },
  });

  return response.data.items.map((item) => ({
    externalCommentId: item.id,
    authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
    content: item.snippet.topLevelComment.snippet.textDisplay,
    createdAt: new Date(item.snippet.topLevelComment.snippet.publishedAt),
  }));
}

async function replyToComment(config) {
  const { accessToken, commentId, message } = config;

  const response = await makeRequest({
    url: `${API_BASE}/comments`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    params: {
      part: 'snippet',
    },
    data: {
      snippet: {
        parentId: commentId,
        textOriginal: message,
      },
    },
  });

  return { externalReplyId: response.data.id };
}

async function getAnalytics(config) {
  const { accessToken, channelId, metrics, dimensions } = config;

  const response = await makeRequest({
    url: 'https://youtubeanalytics.googleapis.com/v2/reports',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      ids: `channel==${channelId}`,
      startDate: config.startDate || '2020-01-01',
      endDate: config.endDate || new Date().toISOString().split('T')[0],
      metrics: metrics || 'views,likes,comments,shares',
      dimensions: dimensions || 'day',
    },
  });

  return response.data;
}

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getAccountInfo,
  publishVideo,
  getComments,
  replyToComment,
  getAnalytics,
};
