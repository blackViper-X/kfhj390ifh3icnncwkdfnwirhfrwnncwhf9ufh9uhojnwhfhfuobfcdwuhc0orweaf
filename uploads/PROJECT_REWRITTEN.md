# Social Poster Platform — Simplified Full-Stack Project Specification

## 1. Project Goal

Build a real, runnable multi-tenant social-media content management SaaS.

The platform manages:

- Instagram
- Facebook
- YouTube
- YouTube Shorts
- Pinterest

The initial target is **10–50 companies**.

The application must use **real social-platform APIs and real OAuth connections**. There must be:

- No mock social adapters
- No fake social accounts
- No mock publishing
- No mock analytics/comments/messages
- No fake failure simulation
- No mock mode switch
- No test-only social data pretending to be real

When a company connects a real social account, the OAuth credentials/tokens, external account IDs, publications, analytics, comments, messages, and synchronization state are stored in PostgreSQL as appropriate.

The goal is a **simple, understandable modular monolith**, not an over-engineered enterprise system.

---

# 2. Core Business Model

```text
                         SUPERUSER
                            |
          +-----------------+-----------------+
          |                 |                 |
       Company A         Company B         Company C
          |                 |                 |
       Manager           Manager           Manager
          |                 |                 |
    Social Accounts   Social Accounts   Social Accounts
          |                 |                 |
        Posts             Posts             Posts
```

Every company is an isolated tenant.

A Company Manager can only access their own company.

A SuperUser can manage every company.

---

# 3. Most Important Requirement — Per-Company API Credentials

There must be **no centralized social-platform OAuth credentials shared by all companies**.

Each company has its own platform configuration.

Example:

```text
Company A
  Facebook App ID     → A_FB_APP_ID
  Facebook Secret     → encrypted in database

Company B
  Facebook App ID     → B_FB_APP_ID
  Facebook Secret     → encrypted in database
```

Company A's OAuth flow must use Company A's Facebook application.

Company B's OAuth flow must use Company B's Facebook application.

The same rule applies to:

- Instagram/Facebook
- YouTube/Google
- Pinterest

The database is the source of truth for company-specific platform credentials.

The `.env` file must NOT contain:

```text
FACEBOOK_CLIENT_ID
FACEBOOK_CLIENT_SECRET
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
PINTEREST_CLIENT_ID
PINTEREST_CLIENT_SECRET
```

The `.env` file contains only infrastructure/application secrets such as:

```text
DATABASE_URL
REDIS_URL
JWT_SECRET
ENCRYPTION_KEY
S3 credentials
PORT
```

---

# 4. Technology Stack

## Frontend

Use:

- React
- JavaScript
- Vite
- React Router
- Axios
- CSS or a simple UI library
- React state/hooks

Do not use TypeScript.

Do not create a separate shared TypeScript package.

Keep frontend code straightforward.

## Backend

Use:

- Node.js
- JavaScript
- Express.js
- Prisma
- PostgreSQL
- Redis
- BullMQ
- Sharp
- FFmpeg
- Axios
- JWT
- bcrypt
- Node.js crypto

Do not use TypeScript.

Do not create unnecessary abstraction layers.

## Storage

Use:

- S3-compatible object storage
- MinIO locally

PostgreSQL stores media metadata.

Images/videos themselves are stored in object storage.

---

# 5. Architecture

Use a **modular monolith**.

Do not create microservices.

```text
React
  |
  | HTTP
  v
Express API
  |
  +---- PostgreSQL / Prisma
  |
  +---- Redis / BullMQ
  |
  +---- S3 / MinIO
  |
  +---- Social Platform APIs

BullMQ Worker
  |
  +---- PostgreSQL
  +---- Redis
  +---- S3
  +---- Social Platform APIs
```

The API handles normal user requests.

The worker handles long-running operations.

---

# 6. Keep the Code Simple

The implementation should favor understandable code over excessive abstraction.

Use this general structure:

```text
apps/
├── web/
└── api/

prisma/
infrastructure/
docker-compose.yml
.env.example
README.md
package.json
```

Backend:

```text
apps/api/src/
├── config/
├── middleware/
├── routes/
├── controllers/
├── services/
├── adapters/
│   └── social/
│       ├── instagram.js
│       ├── facebook.js
│       ├── youtube.js
│       └── pinterest.js
├── workers/
├── queues/
├── media/
├── utils/
├── app.js
└── server.js
```

Frontend:

```text
apps/web/src/
├── components/
├── pages/
├── features/
├── services/
├── hooks/
├── utils/
├── App.jsx
└── main.jsx
```

Do NOT create all of the following unless the code genuinely requires
them:

- repositories for every model
- separate domain state-machine packages
- separate shared type packages
- complicated dependency injection
- event-sourcing
- CQRS
- microservices
- Kafka
- Kubernetes
- service meshes
- unnecessary design patterns

A normal flow such as:

```text
route → controller → service → Prisma
```

is preferred.

---

# 7. Roles

## SUPERUSER

SuperUser can:

- create companies
- delete companies
- create Company Managers
- configure company API credentials
- connect social accounts
- disconnect social accounts
- manage any company's content
- publish for any company
- approve/reject content
- reply to comments
- reply to DMs where supported
- view all analytics
- view audit history

Analytics hierarchy:

```text
All Companies
  → Company
    → Platform
      → Post
```

## COMPANY_MANAGER

Company Manager can:

- access their company
- create posts
- edit posts
- upload media
- select platforms
- configure platform-specific content
- preview posts
- publish
- schedule
- request approval
- handle comments
- handle messages where supported
- view company analytics

Company Manager cannot:

- create/delete companies
- access another company
- configure platform-level company structure
- modify another company's social accounts

Initially enforce:

```text
One COMPANY_MANAGER per company
```

Use a membership table so additional roles can be added later.

---

# 8. Authentication

Use:

```text
JWT
+
bcrypt password hashing
```

Authentication flow:

```text
Login
  ↓
Verify email/password
  ↓
Create JWT
  ↓
Frontend stores authentication state
  ↓
Authenticated API requests
  ↓
JWT middleware
```

The JWT should contain only safe identity information such as:

```text
userId
role
```

Never place OAuth tokens or social secrets inside JWTs.

---

# 9. Multi-Tenant Security

The backend must never trust:

- companyId supplied by the client
- role supplied by the client
- publication status supplied by the client
- approval status supplied by the client
- external post ID supplied by the client

The server derives company access from:

```text
Authenticated User
      ↓
CompanyMembership
      ↓
Allowed Company
```

Use two security layers:

1. Application-level authorization
2. PostgreSQL Row-Level Security

The application should reject unauthorized requests before reaching business logic.

PostgreSQL RLS provides a second database-level protection layer.

Keep the RLS implementation understandable. Do not build a large custom
authorization framework.

---

# 10. Database

Use:

```text
PostgreSQL + Prisma
```

Do not add MongoDB.

Do not use MongoDB/Mongoose.

PostgreSQL is responsible for:

- users
- companies
- memberships
- platform credentials
- social accounts
- OAuth credentials
- posts
- post targets
- media metadata
- publications
- schedules
- comments
- conversations
- messages
- analytics
- audit records
- synchronization state

Use JSON/JSONB only for genuinely platform-specific data.

---

# 11. Core Prisma Models

The exact Prisma field names may be adjusted if necessary, but the
relationships must remain clear.

## User

```text
id
email
name
passwordHash
systemRole
createdAt
updatedAt
```

Roles:

```text
SUPERUSER
COMPANY_MANAGER
```

## Company

```text
id
name
slug
approvalRequired
createdAt
updatedAt
deletedAt
```

## CompanyMembership

```text
id
userId
companyId
role
createdAt
```

Unique:

```text
userId + companyId
```

## CompanyPlatformConfig

Stores the company's own API/OAuth application configuration.

```text
id
companyId
platform
clientId
encryptedClientSecret
iv
authTag
redirectUri
scopes
isActive
createdAt
updatedAt
```

Unique:

```text
companyId + platform
```

The client secret is encrypted with AES-256-GCM.

The encryption key is stored outside PostgreSQL in:

```text
ENCRYPTION_KEY
```

The secret is decrypted only on the backend when required for OAuth/API
operations.

Never return it to React.

---

# 12. SocialAccount

```text
id
companyId
platform
platformAccountId
accountName
status
createdAt
updatedAt
```

Status:

```text
CONNECTED
DISCONNECTED
REAUTH_REQUIRED
```

No `isMock` field.

There are no mock accounts.

---

# 13. OAuthCredential

Store encrypted tokens.

```text
id
socialAccountId
encryptedAccessToken
encryptedRefreshToken
iv
authTag
expiresAt
createdAt
updatedAt
```

Tokens must never be returned to the frontend.

Tokens must never be logged.

---

# 14. Content Model

Use one canonical Post with platform-specific targets.

```text
Post
  |
  +---- Instagram PostTarget
  +---- Facebook PostTarget
  +---- YouTube PostTarget
  +---- Pinterest PostTarget
```

## Post

```text
id
companyId
creatorId
contentStatus
approvalStatus
globalMediaMode
scheduledAt
timezone
createdAt
updatedAt
```

## PostTarget

```text
id
postId
platform
socialAccountId

caption
title
description
hashtags
keywords
thumbnailUrl
platformMetadata

externalPostId
externalUrl
platformStatus
errorMessage

createdAt
updatedAt
```

Unique:

```text
postId + platform
```

Do not create completely separate posts for every platform.

Do not create a giant table containing every possible platform field.

---

# 15. Post Status

Use:

```text
DRAFT
SCHEDULED
PUBLISHING
PUBLISHED
PARTIALLY_PUBLISHED
FAILED
CANCELLED
```

Keep approval status separate.

---

# 16. Approval Status

Use:

```text
NOT_REQUIRED
PENDING
APPROVED
REJECTED
```

## When approvalRequired is ON

```text
DRAFT
  ↓
PENDING
  ↓
APPROVED
  ↓
PUBLISH / SCHEDULE
```

## When approvalRequired is OFF

The manager can choose:

```text
Publish directly
```

or:

```text
Request approval
```

## Approval invalidation

If approved content is materially changed:

```text
APPROVED
  ↓
Content changed
  ↓
PENDING
```

Do not allow an old approval to approve a materially changed version.

---

# 17. Content History

Keep important history.

Use a simple `PostVersion` model:

```text
id
postId
versionNumber
contentSnapshot
createdById
createdAt
```

Store the important platform-specific content and media configuration
inside the snapshot.

Do not overwrite important historical versions.

---

# 18. Media

Do not store media files inside PostgreSQL.

Use:

```text
S3 / MinIO
```

PostgreSQL stores:

```text
Media
├── id
├── companyId
├── postId
├── originalKey
├── mimeType
├── size
├── processingStatus
└── createdAt
```

Generated media variants may use:

```text
MediaVariant
├── id
├── mediaId
├── platform
├── variantKey
├── width
├── height
├── processingMode
└── createdAt
```

Generated variants are temporary/derived data.

---

# 19. Media Processing

Use:

```text
Sharp → images
FFmpeg → videos
```

Support two user-selectable modes.

## INTELLIGENT

This does NOT mean AI/ML.

Use basic focal-point cropping.

The user can select:

```text
focalPointX
focalPointY
```

The crop keeps the selected focal area visible.

## RESIZE_PAD

Preserve the whole media.

Resize it to the target dimensions and pad when necessary.

No subject detection.

---

# 20. Manual Crop

The composer should provide a simple focal-point/crop editor.

The user can:

- move the focal point
- adjust crop position
- adjust scale where appropriate
- preview the result

Store configuration such as:

```text
mode
focalPointX
focalPointY
scale
aspectRatio
```

Do not implement AI face detection or object detection.

Do not add an ML service for media cropping.

---

# 21. Video

Use FFmpeg.

The normal workflow is:

```text
Upload
  ↓
Process
  ↓
Preview
  ↓
Publish
```

Support basic focal positioning.

Optional keyframes can be stored later if required, but do not make
keyframe editing a mandatory first-version workflow.

Keep the initial implementation simple.

---

# 22. Platform Adapters

Create one adapter per platform:

```text
SocialAdapter
├── InstagramAdapter
├── FacebookAdapter
├── YouTubeAdapter
└── PinterestAdapter
```

Each adapter contains the platform-specific code for:

- authorization URL
- OAuth callback/token exchange
- token refresh
- account information
- publishing
- comments
- messages where supported
- analytics
- webhook verification
- webhook parsing

The rest of the application calls the adapter rather than directly
calling Facebook/Google/Pinterest APIs.

---

# 23. Real APIs Only

Only real integrations are allowed.

There is no:

```text
MockAdapter
MockSocialAccount
MockStorage
MockWebhookEmitter
MockMode
FAIL_429 tags
FAIL_5XX tags
FAIL_AUTH tags
fake analytics
fake comments
fake messages
```

Do not add fake social data to make the application appear complete.

If a platform cannot be connected because its developer credentials,
permissions, app review, or API access have not been configured, show
the real connection error and tell the user what configuration is
missing.

Do not silently replace it with fake data.

---

# 24. Real OAuth Flow

General flow:

```text
SuperUser configures CompanyPlatformConfig
          ↓
Manager/SuperUser chooses Connect
          ↓
Backend loads that company's platform config
          ↓
Backend creates OAuth authorization URL
          ↓
User is redirected to real platform
          ↓
Platform redirects to backend callback
          ↓
Backend exchanges authorization code
          ↓
Backend encrypts tokens
          ↓
OAuthCredential saved
          ↓
SocialAccount saved as CONNECTED
```

The OAuth state must identify the intended company and protect against
CSRF/session confusion.

Never trust a company ID supplied after the OAuth redirect without
validating the stored OAuth state.

---

# 25. Token Refresh

Use BullMQ for token refresh where supported.

Before publishing:

```text
Load SocialAccount
  ↓
Load encrypted OAuthCredential
  ↓
Check expiration
  ↓
Refresh when necessary
  ↓
Save new encrypted token
  ↓
Publish
```

If refresh fails:

```text
SocialAccount → REAUTH_REQUIRED
Publication → FAILED
```

The user can reconnect the account and retry.

---

# 26. Publishing Model

A publish request may target multiple platforms.

Create one parent:

```text
Publication
```

and one target per platform:

```text
Publication
├── Instagram
├── Facebook
├── YouTube
└── Pinterest
```

Suggested models:

## Publication

```text
id
postId
companyId
status
scheduledAt
publishedAt
createdById
createdAt
```

## PublicationTarget

```text
id
publicationId
postTargetId
platform
socialAccountId
status
externalPostId
externalUrl
attempts
idempotencyKey
errorMessage
createdAt
updatedAt
```

## PublishingAttempt

```text
id
publicationTargetId
attemptNumber
status
errorMessage
externalPostId
createdAt
```

---

# 27. Publishing Workflow

```text
User clicks Publish
       ↓
Validate post
       ↓
Validate connected accounts
       ↓
Create Publication
       ↓
Create PublicationTarget for each platform
       ↓
Queue one BullMQ job per platform
       ↓
Worker publishes each platform
       ↓
Save external ID/URL
       ↓
Update platform status
       ↓
Update parent status
```

HTTP requests must not wait for actual social publishing.

---

# 28. Idempotency

A retry must not blindly create another social post.

Before publishing:

```text
Check PublicationTarget
       ↓
Already PUBLISHED?
       ↓
Yes → stop
No
       ↓
Check whether previous attempt may have succeeded
       ↓
Reconcile with platform when possible
       ↓
Publish only when safe
```

Store:

```text
idempotencyKey
externalPostId
attempt history
```

If a platform supports an idempotency mechanism, use it.

If it does not, use database state plus platform reconciliation where
the API allows it.

Keep this logic simple and local to the publishing service/adapter.

---

# 29. Redis Lock

Use a small Redis lock around a publication target.

```text
Worker
  ↓
Acquire lock
  ↓
Read PublicationTarget from PostgreSQL
  ↓
Publish/reconcile
  ↓
Update PostgreSQL
  ↓
Release lock
```

PostgreSQL remains the source of truth.

Redis is not the permanent publication state.

---

# 30. Retry

Automatically retry only temporary failures such as:

- network failure
- timeout
- HTTP 429
- HTTP 5xx
- temporary platform outage

Do not automatically retry:

- invalid credentials
- missing permissions
- invalid media
- unsupported media
- invalid platform data

Use a small number of retries with exponential backoff.

After retries fail:

```text
FAILED
```

Provide:

```text
Retry
```

for the user.

Every attempt is stored in `PublishingAttempt`.

---

# 31. Partial Publishing

Example:

```text
Instagram → PUBLISHED
Facebook  → PUBLISHED
YouTube   → FAILED
Pinterest → PUBLISHED
```

Parent:

```text
PARTIALLY_PUBLISHED
```

A failed platform can be retried independently.

If the retry succeeds and every target is now published:

```text
PUBLISHED
```

---

# 32. Scheduling

The application UI uses:

```text
Asia/Kolkata / IST
```

Store timestamps in UTC.

Flow:

```text
User selects:
2026-08-20 18:30 IST

        ↓

Convert to UTC

        ↓

Store UTC in PostgreSQL

        ↓

Create BullMQ delayed job

        ↓

Job executes at scheduled time

        ↓

Create/execute publication jobs
```

Cancellation must cancel the scheduled operation and mark the schedule
as cancelled.

---

# 33. Social Account Disconnect

When an account is disconnected:

Preserve:

- posts
- post targets
- external IDs
- publication history
- analytics already stored
- comments already stored
- messages already stored
- audit history

Cancel or invalidate future publications that depend on the
disconnected account.

Do not delete historical business records.

---

# 34. Comments

Create a unified comment model.

Store:

```text
companyId
socialAccountId
postTargetId
platform
externalCommentId
authorName
content
createdAt
replyStatus
replyContent
```

The UI should show:

- platform
- post
- author
- comment
- timestamp
- reply action

Reply through the correct platform adapter.

---

# 35. Messages / DMs

Create:

```text
Conversation
Message
```

Conversation:

```text
companyId
socialAccountId
platform
externalConversationId
participantId
participantName
lastMessageAt
unreadCount
```

Message:

```text
conversationId
externalMessageId
sender
isFromPage
content
timestamp
```

Reply through the correct adapter where the platform supports messaging.

If a platform does not support the required operation, clearly show
that capability as unavailable.

Do not fake the capability.

---

# 36. Analytics

Support platform-specific analytics.

Possible metrics:

- followers/subscribers
- reach
- impressions
- likes/reactions
- comments
- shares/reposts
- views
- watch time
- engagement rate
- profile/page visits
- growth
- post performance

Do not assume every platform provides every metric.

If a metric is not available, represent it as unavailable/null rather
than inventing a number.

---

# 37. Analytics Storage

Store useful normalized results in PostgreSQL.

Use:

```text
AnalyticsSnapshot
```

for recent data.

Use daily/monthly aggregation when the dataset becomes large.

Do not store entire raw API responses forever.

The initial target is only 10–50 companies, so do not introduce a
separate analytics warehouse.

---

# 38. Synchronization

Use three real synchronization methods.

## Webhooks

For platforms that support them:

```text
Platform
  ↓
Webhook endpoint
  ↓
Verify signature
  ↓
Validate payload
  ↓
Deduplicate event
  ↓
Queue webhook job
  ↓
Return quickly
  ↓
Worker processes event
```

## Periodic sync

BullMQ scheduled jobs can synchronize:

- analytics
- comments
- messages
- account information

## Manual refresh

Allow:

```text
Refresh Now
```

The backend queues a synchronization job.

The UI shows:

```text
Last synced: 3 minutes ago
```

Do not claim data is real-time unless it actually is.

---

# 39. Webhook Security

Implement:

- HTTPS in deployment
- platform signature verification
- event ID deduplication
- payload validation
- rate limiting
- quick HTTP acknowledgement
- asynchronous processing

Never process expensive work directly inside the webhook request.

Store webhook event IDs to prevent duplicate processing.

---

# 40. API Rate Limits

Do not build a giant quota/circuit-breaker framework for the first
version.

Use a simple centralized helper for external API calls.

It should provide:

- sensible request timeout
- handling for HTTP 429
- retry-after handling when available
- small exponential backoff
- basic concurrency protection

Do not implement a complicated per-company quota engine unless actual
usage proves it is necessary.

The architecture must still prevent one company's workload from
unnecessarily overwhelming the worker.

---

# 41. Audit Log

Store important actions:

- company created
- company deleted
- manager created
- platform configuration changed
- social account connected
- social account disconnected
- post created
- post edited
- approval
- rejection
- publishing
- retry
- membership changes
- security-sensitive operations

Audit fields:

```text
actorId
companyId
action
targetType
targetId
metadata
result
createdAt
```

Never store:

- passwords
- OAuth tokens
- client secrets
- encryption keys

---

# 42. Logging

Use simple structured server logging.

Include useful context such as:

```text
requestId
userId
companyId
postId
publicationId
platform
jobId
```

Never log secrets.

Do not add multiple logging frameworks.

Use one logging solution.

---

# 43. Frontend Pages

## Authentication

```text
/login
```

## SuperUser

```text
/dashboard
/companies
/companies/:id
/companies/:id/social
/analytics
/inbox
/comments
/audit
```

## Company Manager

```text
/dashboard
/posts
/posts/new
/posts/:id
/calendar
/approvals
/inbox
/comments
/analytics
/settings
```

---

# 44. Company Management UI

SuperUser can:

- create company
- delete company
- create manager
- view company
- configure platform credentials
- connect social accounts
- disconnect social accounts

Company platform configuration UI:

```text
Platform
Client ID
Client Secret
Redirect URI
Scopes
Save
```

After saving:

```text
Configured
```

The client secret must remain masked.

Never show the complete stored secret again.

---

# 45. Social Account UI

For each company:

```text
Instagram
Facebook
YouTube
Pinterest
```

Show:

```text
Not configured
Configured
Connected
Disconnected
Re-authentication required
```

Provide:

```text
Connect
Reconnect
Disconnect
```

The UI never receives OAuth access/refresh tokens.

---

# 46. Content Composer

The composer must support:

```text
Common content
+
Media
+
Platform selection
+
Platform-specific fields
+
Media processing
+
Preview
+
Approval
+
Publish/Schedule
```

Platform selection:

```text
Instagram
Facebook
YouTube
YouTube Shorts
Pinterest
```

Only show connected platforms as publishable targets.

---

# 47. Platform-Specific Fields

Show only fields required/useful for the selected platform.

Examples:

Instagram:

```text
Caption
Hashtags
```

Facebook:

```text
Caption
```

YouTube:

```text
Title
Description
Keywords
Thumbnail
```

YouTube Shorts:

```text
Title
Description
```

Pinterest:

```text
Title
Description
Link
Board
```

The actual adapter validates the final payload before publishing.

---

# 48. Platform Preview

Show a simple preview for every selected platform.

The preview should reflect:

- media
- aspect ratio
- crop
- caption
- title
- description
- thumbnail
- relevant metadata

The preview is a UI representation. The actual platform adapter remains
responsible for final validation.

---

# 49. Dashboard

SuperUser dashboard:

```text
Total companies
Connected accounts
Recent publications
Failed publications
Analytics summary
Recent activity
```

Manager dashboard:

```text
Posts
Scheduled posts
Pending approvals
Publishing failures
Connected accounts
Analytics summary
Recent activity
```

Keep dashboards useful rather than visually complicated.

---

# 50. Calendar

Provide a simple scheduled-post calendar/list.

Show:

```text
Post
Company
Platform
Scheduled time in IST
Status
```

Allow:

```text
Open
Edit
Cancel
```

---

# 51. API Structure

Use versioned REST endpoints.

```text
/api/v1/auth
/api/v1/companies
/api/v1/memberships
/api/v1/platform-configs
/api/v1/social-accounts
/api/v1/posts
/api/v1/media
/api/v1/publications
/api/v1/schedules
/api/v1/comments
/api/v1/conversations
/api/v1/messages
/api/v1/analytics
/api/v1/audit
/api/v1/webhooks
```

Keep controllers thin.

Example:

```text
route
  ↓
middleware
  ↓
controller
  ↓
service
  ↓
Prisma / adapter
```

---

# 52. Validation

Validate on the backend:

- authentication input
- company input
- platform configuration
- post data
- platform-specific content
- media metadata
- schedules
- webhook payloads

Frontend validation improves user experience but is never the security
boundary.

Use straightforward validation functions.

Do not add a large validation framework unless it clearly improves the
code.

---

# 53. Error Handling

Use a simple consistent error response:

```json
{
  "success": false,
  "message": "Human readable message",
  "code": "ERROR_CODE"
}
```

The API should distinguish:

```text
400 → invalid input
401 → unauthenticated
403 → forbidden
404 → not found
409 → conflict
429 → rate limited
500 → server error
502/503 → external platform problem
```

Do not expose stack traces or secrets to the frontend.

---

# 54. Queues

Use BullMQ.

Only create queues/jobs that provide real value.

Required jobs:

```text
media.process
media.cleanup
post.publish
post.schedule
analytics.sync
comments.sync
messages.sync
token.refresh
webhook.process
```

A separate `post.retry` queue is not required. Manual retry can simply
enqueue another `post.publish` job after validating the current state.

Workers run separately from Express.

---

# 55. Queue Processing

Example:

```text
POST /publications
        ↓
Create Publication
        ↓
Create PublicationTargets
        ↓
Add BullMQ jobs
        ↓
Return HTTP response
```

Worker:

```text
Job
 ↓
Load target
 ↓
Check account
 ↓
Refresh token if required
 ↓
Get media
 ↓
Call real adapter
 ↓
Save result
 ↓
Update parent publication
```

---

# 56. Object Storage

Use an abstraction so local MinIO can later be replaced by:

- AWS S3
- Cloudflare R2
- Backblaze B2
- another S3-compatible service

Local:

```text
MinIO
```

Production:

```text
External S3-compatible storage
```

Media files should not pass through PostgreSQL.

---

# 57. Docker

Provide:

```text
Dockerfile
docker-compose.yml
.env.example
```

Local infrastructure:

```text
postgres
redis
minio
api
worker
web
```

Nginx may be added for production deployment.

Do not require Kubernetes.

Do not require Kafka.

Do not require multiple application servers.

---

# 58. Environment Variables

Example:

```env
NODE_ENV=development

PORT=4000

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/social_cms

REDIS_URL=redis://redis:6379

JWT_SECRET=change-me

ENCRYPTION_KEY=change-me

S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=social-cms-media

SYSTEM_TIMEZONE=Asia/Kolkata

OAUTH_BASE_URL=http://localhost:4000
WEB_URL=http://localhost:5173
```

Do NOT put company-specific social API credentials in `.env`.

---

# 59. Seed Data

Seed only application/bootstrap data.

Example:

```text
SuperUser
```

Optionally create empty companies for development.

Do NOT seed:

- fake social accounts
- fake OAuth tokens
- fake external post IDs
- fake analytics
- fake comments
- fake messages
- fake platform credentials

Real social data must come from real platform connections.

---

# 60. Testing Philosophy

This project does **not** use mock social APIs or fake platform tests.

Do not create:

```text
MockAdapter
MockSocialAccount
MockStorage
MockWebhookEmitter
FakeAnalytics
FakeComments
FakeMessages
```

Testing should focus on the actual application against:

- PostgreSQL
- Redis
- MinIO/S3
- real OAuth configuration
- real platform APIs when credentials are available

For local infrastructure tests, PostgreSQL/Redis/MinIO containers are
real infrastructure, not fake application behavior.

Manual verification of real platform integrations is acceptable when
platform developer credentials or permissions are required.

Do not claim an integration works if it has not been verified with the
real platform.

---

# 61. Real Integration Verification

A real platform integration should be verified in this order:

```text
Create Company
    ↓
Configure company's platform application
    ↓
Connect real social account
    ↓
Verify SocialAccount = CONNECTED
    ↓
Verify encrypted OAuthCredential exists
    ↓
Create real post
    ↓
Publish
    ↓
Verify external platform post ID
    ↓
Verify external URL when available
    ↓
Verify PublicationTarget = PUBLISHED
    ↓
Sync analytics/comments/messages where supported
    ↓
Verify data stored in PostgreSQL
```

Never mark an integration complete based only on UI behavior.

---

# 62. Important Platform Rules

## Instagram

Use the official Meta/Instagram APIs.

Publishing must follow the current official API requirements for the
connected account.

## Facebook

Use the official Meta Graph API.

Handle Page/account selection as required by the OAuth flow.

## YouTube

Use the official YouTube Data API.

Use OAuth with the required upload scopes.

YouTube Shorts use the same YouTube account/OAuth infrastructure but
follow Shorts-specific media/content rules.

## Pinterest

Use the official Pinterest API.

Handle board selection and pin publishing through the official API.

The adapter is responsible for current platform-specific API behavior.

---

# 63. Data Source of Truth

Our PostgreSQL database is authoritative for:

- companies
- users
- memberships
- application content
- approval state
- schedules
- publication workflow
- internal history
- audit records
- media configuration
- stored platform IDs
- synchronization state

The social platforms remain authoritative for:

- actual external post state
- platform-generated IDs
- platform engagement
- platform metrics
- external comments/messages

Do not attempt to copy entire social platforms into PostgreSQL.

---

# 64. Performance

Initial scale:

```text
10–50 companies
```

Use:

- database indexes
- pagination
- efficient Prisma queries
- Redis for queue state
- BullMQ for background work
- sensible worker concurrency
- object storage for media

Do not prematurely introduce:

- Kubernetes
- Kafka
- microservices
- separate analytics warehouse
- distributed tracing platform
- complicated quota infrastructure

If the product later exceeds the initial scale, architecture can be
expanded then.

---

# 65. Security Requirements

Implement:

- bcrypt password hashing
- JWT authentication
- RBAC
- company authorization
- PostgreSQL RLS
- encrypted OAuth credentials
- HTTPS in production
- secure HTTP headers
- CORS
- rate limiting
- webhook signature verification
- input validation
- file type validation
- upload size limits
- audit logging

Never:

- store raw passwords
- expose OAuth tokens
- expose client secrets
- log secrets
- trust client company IDs
- trust client roles

---

# 66. File Upload Security

Validate:

```text
mime type
file extension
file size
actual media format
```

Do not trust only the browser-provided MIME type.

Use Sharp/FFmpeg validation for media where appropriate.

Store uploads using generated object-storage keys rather than trusting
user-provided filenames.

---

# 67. Implementation Phases

Build in this order.

## Phase 1 — Foundation

```text
JavaScript project
React frontend
Express backend
PostgreSQL
Prisma
Redis
Docker
```

## Phase 2 — Authentication

```text
User
Company
CompanyMembership
JWT
RBAC
RLS
```

## Phase 3 — Per-Company Social Configuration

```text
CompanyPlatformConfig
encryption
SuperUser configuration UI
```

## Phase 4 — Real OAuth

Implement:

```text
Instagram/Facebook
YouTube
Pinterest
```

one platform at a time.

Do not create fake adapters for platforms not yet configured.

## Phase 5 — Social Accounts

```text
Connect
Reconnect
Disconnect
Token refresh
Account state
```

## Phase 6 — Posts

```text
Post
PostTarget
PostVersion
Composer
Platform fields
Preview
```

## Phase 7 — Media

```text
S3/MinIO
Sharp
FFmpeg
INTELLIGENT crop
RESIZE_PAD
focal point
preview
```

## Phase 8 — Approval

```text
approvalRequired
PENDING
APPROVED
REJECTED
approval invalidation
```

## Phase 9 — Publishing

```text
Publication
PublicationTarget
PublishingAttempt
BullMQ
Redis lock
retry
reconciliation
```

## Phase 10 — Scheduling

```text
IST UI
UTC storage
BullMQ delayed job
cancel
```

## Phase 11 — Comments and Messages

```text
sync
display
reply
```

## Phase 12 — Analytics

```text
sync
storage
dashboard
```

## Phase 13 — Webhooks and Audit

```text
webhook verification
deduplication
audit
```

## Phase 14 — Production Cleanup

Remove unused code and dependencies.

Confirm:

```text
No TypeScript
No mock adapters
No fake social data
No centralized platform credentials
No unnecessary abstraction
```

---

# 68. Suggested API Endpoints

## Authentication

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

## Companies

```text
GET    /api/v1/companies
POST   /api/v1/companies
GET    /api/v1/companies/:id
PATCH  /api/v1/companies/:id
DELETE /api/v1/companies/:id
```

## Managers

```text
POST   /api/v1/companies/:id/manager
PATCH  /api/v1/companies/:id/manager
```

## Platform Configuration

```text
GET  /api/v1/companies/:id/platform-configs
POST /api/v1/companies/:id/platform-configs
PATCH /api/v1/companies/:id/platform-configs/:platform
DELETE /api/v1/companies/:id/platform-configs/:platform
```

## Social Accounts

```text
GET  /api/v1/companies/:id/social-accounts
GET  /api/v1/companies/:id/social-accounts/:platform/connect
GET  /api/v1/social-accounts/oauth/callback
POST /api/v1/social-accounts/:id/disconnect
POST /api/v1/social-accounts/:id/refresh
```

## Posts

```text
GET    /api/v1/posts
POST   /api/v1/posts
GET    /api/v1/posts/:id
PATCH  /api/v1/posts/:id
DELETE /api/v1/posts/:id
POST   /api/v1/posts/:id/submit-approval
POST   /api/v1/posts/:id/approve
POST   /api/v1/posts/:id/reject
```

## Media

```text
POST /api/v1/media/upload
POST /api/v1/media/:id/process
GET  /api/v1/media/:id
```

## Publications

```text
POST /api/v1/publications
GET  /api/v1/publications/:id
POST /api/v1/publications/:id/retry
POST /api/v1/publications/:id/cancel
```

## Comments

```text
GET  /api/v1/comments
POST /api/v1/comments/:id/reply
```

## Messages

```text
GET  /api/v1/conversations
GET  /api/v1/conversations/:id/messages
POST /api/v1/conversations/:id/messages
```

## Analytics

```text
GET /api/v1/analytics
GET /api/v1/analytics/companies/:id
GET /api/v1/analytics/posts/:id
```

## Webhooks

```text
POST /api/v1/webhooks/:platform
GET  /api/v1/webhooks/:platform
```

---

# 69. Important Business Rules

1. A Manager cannot access another company.
2. SuperUser can access all companies.
3. Each company has at most one Company Manager initially.
4. Each company/platform has at most one active platform configuration.
5. Social OAuth credentials belong to a company.
6. OAuth secrets are encrypted.
7. OAuth tokens are encrypted.
8. OAuth tokens never reach the frontend.
9. No social platform credentials are shared through `.env`.
10. A disconnected account keeps historical data.
11. Future publications for disconnected accounts are cancelled.
12. Publishing is asynchronous.
13. Each platform has its own publication target.
14. One platform failure does not undo successful platforms.
15. Retries must be safe.
16. Approved content becomes pending again after material edits.
17. Schedule times are entered/displayed in IST.
18. Timestamps are stored in UTC.
19. Platform-specific API logic stays inside adapters.
20. Real social APIs are the only source for external social data.
21. No fake social data is used.
22. PostgreSQL is the primary database.
23. Redis is used for jobs and short-lived coordination.
24. Media files are stored in object storage.
25. Long-running operations run in workers.

---

# 70. Definition of Done

The project is complete when all of the following work:

### Infrastructure

- [ ] Docker Compose starts PostgreSQL
- [ ] Docker Compose starts Redis
- [ ] Docker Compose starts MinIO/local object storage
- [ ] API starts
- [ ] Worker starts
- [ ] Frontend starts
- [ ] Prisma migrations work
- [ ] Seed creates only application/bootstrap data

### Authentication

- [ ] SuperUser login works
- [ ] Company Manager login works
- [ ] Passwords are hashed
- [ ] JWT authentication works
- [ ] RBAC works
- [ ] Company isolation works
- [ ] PostgreSQL RLS is active

### Companies

- [ ] SuperUser creates company
- [ ] SuperUser deletes company safely
- [ ] SuperUser creates manager
- [ ] Manager belongs to the correct company
- [ ] Manager cannot access another company

### Social Configuration

- [ ] SuperUser configures Facebook/Instagram credentials per company
- [ ] SuperUser configures YouTube credentials per company
- [ ] SuperUser configures Pinterest credentials per company
- [ ] Client secrets are encrypted
- [ ] Secrets never reach frontend
- [ ] No centralized social credentials exist in `.env`

### Real OAuth

- [ ] Real Facebook/Instagram OAuth works when configured
- [ ] Real YouTube OAuth works when configured
- [ ] Real Pinterest OAuth works when configured
- [ ] OAuth tokens are encrypted
- [ ] Token refresh works where supported
- [ ] Reauthorization works
- [ ] Disconnect works

### Content

- [ ] Manager creates post
- [ ] Manager edits post
- [ ] Manager selects platforms
- [ ] Platform-specific fields work
- [ ] Post versions are stored
- [ ] Platform previews work

### Media

- [ ] Image upload works
- [ ] Video upload works
- [ ] Sharp processing works
- [ ] FFmpeg processing works
- [ ] Intelligent focal-point crop works
- [ ] Resize/pad works
- [ ] Manual focal-point adjustment works
- [ ] Media is stored in object storage
- [ ] Media metadata is stored in PostgreSQL

### Approval

- [ ] Approval toggle works
- [ ] Manager can request approval
- [ ] SuperUser can approve
- [ ] SuperUser can reject
- [ ] SuperUser can edit
- [ ] Material edits invalidate approval

### Publishing

- [ ] Publish to one platform
- [ ] Publish to multiple platforms
- [ ] Parent publication is stored
- [ ] Platform targets are stored
- [ ] Real platform external IDs are stored
- [ ] Publishing happens through BullMQ
- [ ] Publishing attempts are stored
- [ ] Temporary failures retry
- [ ] Permanent failures stop
- [ ] Manual retry works
- [ ] Partial publication works
- [ ] Reconciliation prevents duplicate publishing

### Scheduling

- [ ] IST scheduling UI works
- [ ] UTC is stored
- [ ] BullMQ delayed job works
- [ ] Scheduled publication works
- [ ] Schedule cancellation works

### Social Data

- [ ] Real comments synchronize
- [ ] Real comment replies work where supported
- [ ] Real messages synchronize where supported
- [ ] Real message replies work where supported
- [ ] Real analytics synchronize
- [ ] Sync timestamps are shown

### Webhooks

- [ ] Real supported webhooks can be received
- [ ] Signatures are verified
- [ ] Duplicate events are rejected
- [ ] Webhook work is processed asynchronously

### Audit/Security

- [ ] Important actions are audited
- [ ] Secrets are never logged
- [ ] Passwords are never logged
- [ ] OAuth tokens are never logged
- [ ] File uploads are validated
- [ ] API rate limiting exists
- [ ] Consistent error handling exists

### Code Quality

- [ ] Project uses JavaScript, not TypeScript
- [ ] No mock social adapters exist
- [ ] No fake social accounts exist
- [ ] No mock mode exists
- [ ] No unnecessary test-only platform code exists
- [ ] No centralized platform OAuth credentials exist
- [ ] No unnecessary microservices exist
- [ ] No unnecessary abstraction layers exist
- [ ] README explains setup and real API configuration
- [ ] `.env.example` is complete
- [ ] Application can be started by following README instructions

---

# 71. Final Implementation Rule

Build the **simplest architecture that correctly satisfies this
specification**.

Do not make the system simpler by removing important requirements.

Do not make the system more complicated by adding technologies or
patterns that are not required.

The priority is:

```text
Correct
   ↓
Secure
   ↓
Real integrations
   ↓
Maintainable
   ↓
Easy to understand
   ↓
Scalable enough for 10–50 companies
```

The final code should be understandable to a normal JavaScript/Node.js
developer.

The developer should be able to trace a feature such as publishing:

```text
route
  ↓
controller
  ↓
service
  ↓
BullMQ
  ↓
worker
  ↓
social adapter
  ↓
real platform API
  ↓
PostgreSQL
```

without navigating through unnecessary layers.
