// const { makeRequest } = require('../../utils/apiClient');
// const logger = require('../../utils/logger');

// const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

// async function getAuthorizationUrl(config) {
//   const { clientId, redirectUri, scopes, state } = config;

//   const params = new URLSearchParams({
//     client_id: clientId,
//     redirect_uri: redirectUri,
//     scope: scopes || 'pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish',
//     response_type: 'code',
//     state,
//   });

//   return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
// }

// async function exchangeCodeForTokens(config) {
//   const { clientId, clientSecret, redirectUri, code } = config;

//   const response = await makeRequest({
//     url: `${GRAPH_API_BASE}/oauth/access_token`,
//     method: 'GET',
//     params: {
//       client_id: clientId,
//       client_secret: clientSecret,
//       redirect_uri: redirectUri,
//       code,
//     },
//   });

//   const { access_token, expires_in } = response.data;

//   const longLivedResponse = await makeRequest({
//     url: `${GRAPH_API_BASE}/oauth/access_token`,
//     method: 'GET',
//     params: {
//       grant_type: 'fb_exchange_token',
//       client_id: clientId,
//       client_secret: clientSecret,
//       fb_exchange_token: access_token,
//     },
//   });

//   return {
//     accessToken: longLivedResponse.data.access_token,
//     refreshToken: null,
//     expiresAt: new Date(Date.now() + (longLivedResponse.data.expires_in || 5184000) * 1000),
//   };
// }

// async function refreshAccessToken(config) {
//   const { clientId, clientSecret, accessToken } = config;

//   const response = await makeRequest({
//     url: `${GRAPH_API_BASE}/oauth/access_token`,
//     method: 'GET',
//     params: {
//       grant_type: 'fb_exchange_token',
//       client_id: clientId,
//       client_secret: clientSecret,
//       fb_exchange_token: accessToken,
//     },
//   });

//   return {
//     accessToken: response.data.access_token,
//     refreshToken: null,
//     expiresAt: new Date(Date.now() + (response.data.expires_in || 5184000) * 1000),
//   };
// }

// async function getAccountInfo(accessToken) {
//   const response = await makeRequest({
//     url: `${GRAPH_API_BASE}/me`,
//     method: 'GET',
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//     params: {
//       fields: 'id,name,accounts{id,name,access_token,instagram_business_account{id,username}}',
//     },
//   });

//   return response.data;
// }

// async function publishPost(config) {
//   const { accessToken, pageId, message, imageUrl, videoUrl } = config;

//   if (videoUrl) {
//     const response = await makeRequest({
//       url: `${GRAPH_API_BASE}/${pageId}/videos`,
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//       data: {
//         description: message,
//         file_url: videoUrl,
//       },
//     });

//     return {
//       externalPostId: response.data.id,
//       externalUrl: `https://www.facebook.com/${response.data.id}`,
//     };
//   }

//   if (imageUrl) {
//     const response = await makeRequest({
//       url: `${GRAPH_API_BASE}/${pageId}/photos`,
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//       data: {
//         message,
//         url: imageUrl,
//       },
//     });

//     return {
//       externalPostId: response.data.id,
//       externalUrl: `https://www.facebook.com/${response.data.id}`,
//     };
//   }

//   const response = await makeRequest({
//     url: `${GRAPH_API_BASE}/${pageId}/feed`,
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//     data: { message },
//   });

//   return {
//     externalPostId: response.data.id,
//     externalUrl: `https://www.facebook.com/${response.data.id}`,
//   };
// }

// async function getComments(config) {
//   const { accessToken, postId } = config;

//   const response = await makeRequest({
//     url: `${GRAPH_API_BASE}/${postId}/comments`,
//     method: 'GET',
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//     params: {
//       fields: 'id,message,from{id,name},created_time',
//     },
//   });

//   return response.data.data.map((comment) => ({
//     externalCommentId: comment.id,
//     authorName: comment.from?.name,
//     content: comment.message,
//     createdAt: new Date(comment.created_time),
//   }));
// }

// async function replyToComment(config) {
//   const { accessToken, commentId, message } = config;

//   const response = await makeRequest({
//     url: `${GRAPH_API_BASE}/${commentId}/comments`,
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//     data: { message },
//   });

//   return { externalReplyId: response.data.id };
// }

// async function getAnalytics(config) {
//   const { accessToken, pageId, metrics, period } = config;

//   const response = await makeRequest({
//     url: `${GRAPH_API_BASE}/${pageId}/insights`,
//     method: 'GET',
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//     params: {
//       metric: metrics || 'page_impressions,page_engaged_users',
//       period: period || 'day',
//     },
//   });

//   return response.data.data;
// }

// module.exports = {
//   getAuthorizationUrl,
//   exchangeCodeForTokens,
//   refreshAccessToken,
//   getAccountInfo,
//   publishPost,
//   getComments,
//   replyToComment,
//   getAnalytics,
// };

const { makeRequest } = require('../../utils/apiClient');
const logger = require('../../utils/logger');

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

async function getAuthorizationUrl(config) {
  const { clientId, redirectUri, scopes, state } = config;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes || 'pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish',
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

  const shortLivedToken = response.data?.access_token;
  if (!shortLivedToken) {
    throw new Error(
      `Facebook did not return an access_token during code exchange. Response: ${JSON.stringify(response.data)}`
    );
  }

  const longLivedResponse = await makeRequest({
    url: `${GRAPH_API_BASE}/oauth/access_token`,
    method: 'GET',
    params: {
      grant_type: 'fb_exchange_token',
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: shortLivedToken,
    },
  });

  // Fall back to the short-lived token if the exchange did not return one,
  // so a partial failure never propagates `undefined` into encryption.
  const accessToken = longLivedResponse.data?.access_token || shortLivedToken;
  if (!accessToken) {
    throw new Error(
      `Facebook did not return a long-lived access_token. Response: ${JSON.stringify(longLivedResponse.data)}`
    );
  }

  return {
    accessToken,
    refreshToken: null,
    expiresAt: new Date(Date.now() + (longLivedResponse.data?.expires_in || 5184000) * 1000),
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

  const newAccessToken = response.data?.access_token;
  if (!newAccessToken) {
    throw new Error(
      `Facebook did not return an access_token during refresh. Response: ${JSON.stringify(response.data)}`
    );
  }

  return {
    accessToken: newAccessToken,
    refreshToken: null,
    expiresAt: new Date(Date.now() + (response.data?.expires_in || 5184000) * 1000),
  };
}

async function getAccountInfo(accessToken) {
  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/me`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      fields: 'id,name,accounts{id,name,access_token,instagram_business_account{id,username}}',
    },
  });

  return response.data;
}

async function publishPost(config) {
  const { accessToken, pageId, message, imageUrl, videoUrl } = config;

  if (videoUrl) {
    const response = await makeRequest({
      url: `${GRAPH_API_BASE}/${pageId}/videos`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        description: message,
        file_url: videoUrl,
      },
    });

    return {
      externalPostId: response.data.id,
      externalUrl: `https://www.facebook.com/${response.data.id}`,
    };
  }

  if (imageUrl) {
    const response = await makeRequest({
      url: `${GRAPH_API_BASE}/${pageId}/photos`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        message,
        url: imageUrl,
      },
    });

    return {
      externalPostId: response.data.id,
      externalUrl: `https://www.facebook.com/${response.data.id}`,
    };
  }

  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/${pageId}/feed`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: { message },
  });

  return {
    externalPostId: response.data.id,
    externalUrl: `https://www.facebook.com/${response.data.id}`,
  };
}

async function getComments(config) {
  const { accessToken, postId } = config;

  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/${postId}/comments`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      fields: 'id,message,from{id,name},created_time',
    },
  });

  return response.data.data.map((comment) => ({
    externalCommentId: comment.id,
    authorName: comment.from?.name,
    content: comment.message,
    createdAt: new Date(comment.created_time),
  }));
}

async function replyToComment(config) {
  const { accessToken, commentId, message } = config;

  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/${commentId}/comments`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: { message },
  });

  return { externalReplyId: response.data.id };
}

async function getAnalytics(config) {
  const { accessToken, pageId, metrics, period } = config;

  const response = await makeRequest({
    url: `${GRAPH_API_BASE}/${pageId}/insights`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      metric: metrics || 'page_impressions,page_engaged_users',
      period: period || 'day',
    },
  });

  return response.data.data;
}

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getAccountInfo,
  publishPost,
  getComments,
  replyToComment,
  getAnalytics,
};
