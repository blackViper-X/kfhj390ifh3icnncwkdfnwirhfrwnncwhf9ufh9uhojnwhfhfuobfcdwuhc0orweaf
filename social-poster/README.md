# Social Poster Platform

A multi-tenant social media content management SaaS platform for managing Instagram, Facebook, YouTube, YouTube Shorts, and Pinterest accounts.

## Features

- **Multi-tenant architecture**: Isolated companies with their own social accounts
- **Real OAuth integration**: Connect real social media accounts using company-specific API credentials
- **Content management**: Create, edit, and schedule posts across multiple platforms
- **Media processing**: Image and video processing with intelligent focal-point cropping
- **Approval workflow**: Optional approval process for content before publishing
- **Asynchronous publishing**: BullMQ-based publishing with retry logic
- **Comments & Messages**: View and reply to comments and messages from connected accounts
- **Analytics**: Synchronized analytics from social platforms
- **Audit logging**: Complete audit trail of all actions

## Technology Stack

### Backend
- Node.js with Express.js
- PostgreSQL with Prisma ORM
- Redis with BullMQ for job queues
- S3-compatible storage (MinIO for local development)
- Sharp for image processing
- FFmpeg for video processing

### Frontend
- React 18 with Vite
- React Router for navigation
- Axios for API requests
- Plain CSS for styling

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Real social media API credentials (Facebook/Meta, YouTube/Google, Pinterest)

## Setup

### 1. Clone and Install

```bash
# Install root dependencies
npm install

# Install API dependencies
cd apps/api
npm install

# Install Web dependencies
cd ../web
npm install

cd ../..
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Important**: Generate a secure `ENCRYPTION_KEY` (32-byte hex string):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate a secure `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (port 9000, console on 9001)

### 4. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed SuperUser
npm run prisma:seed
```

### 5. Start Development Servers

In separate terminals:

```bash
# Terminal 1: API Server
npm run dev:api

# Terminal 2: Worker
npm run dev:worker

# Terminal 3: Web Frontend
npm run dev:web
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

Default SuperUser credentials:
- Email: `admin@socialposter.local`
- Password: `change-me-to-a-strong-password`

## Configuring Social Media Platforms

### Facebook & Instagram

1. Create a Meta Developer account at https://developers.facebook.com
2. Create a new app (Business type)
3. Add Facebook Login and Instagram products
4. Configure OAuth redirect URI: `http://localhost:4000/api/v1/social-accounts/oauth/callback`
5. In the application:
   - Go to Companies → Select Company → Configure Platform
   - Select "Facebook" or "Instagram"
   - Enter your App ID and App Secret
   - Set redirect URI
   - Save configuration
6. Connect the social account from the Social Accounts page

### YouTube

1. Create a Google Cloud project at https://console.cloud.google.com
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Configure redirect URI: `http://localhost:4000/api/v1/social-accounts/oauth/callback`
5. In the application:
   - Go to Companies → Select Company → Configure Platform
   - Select "YouTube"
   - Enter your Client ID and Client Secret
   - Save configuration
6. Connect the YouTube account

### Pinterest

1. Create a Pinterest Developer account at https://developers.pinterest.com
2. Create a new app
3. Configure redirect URI: `http://localhost:4000/api/v1/social-accounts/oauth/callback`
4. In the application:
   - Go to Companies → Select Company → Configure Platform
   - Select "Pinterest"
   - Enter your App ID and App Secret
   - Save configuration
5. Connect the Pinterest account

## Usage

### As SuperUser

1. **Create Companies**: Go to Companies page and create new companies
2. **Configure Platforms**: Set up API credentials for each company
3. **Connect Social Accounts**: Use OAuth to connect real social accounts
4. **Create Managers**: Assign company managers to each company
5. **Monitor**: View audit logs and analytics across all companies

### As Company Manager

1. **Create Posts**: Use the post editor to create content
2. **Select Platforms**: Choose which platforms to publish to
3. **Upload Media**: Add images or videos with processing options
4. **Schedule**: Set publication time in IST (stored as UTC)
5. **Publish**: Publish immediately or submit for approval
6. **Monitor**: View comments, messages, and analytics

## Architecture

```
React Frontend (Vite)
    ↓ HTTP
Express API
    ↓
    ├── PostgreSQL (Prisma)
    ├── Redis (BullMQ)
    ├── S3/MinIO (Media)
    └── Social Platform APIs

BullMQ Workers
    ↓
    ├── Publishing
    ├── Media Processing
    ├── Analytics Sync
    └── Comments/Messages Sync
```

## Key Design Decisions

- **Per-company API credentials**: Each company has its own OAuth app configuration
- **No mocks**: All social integrations use real APIs
- **Modular monolith**: Simple, understandable architecture
- **Functional style**: No OOP, just functions and modules
- **Encrypted secrets**: OAuth tokens and client secrets encrypted with AES-256-GCM
- **Row-level security**: PostgreSQL RLS for tenant isolation
- **Asynchronous publishing**: BullMQ jobs with retry logic

## Security

- JWT authentication with bcrypt password hashing
- OAuth tokens encrypted in database
- Client secrets never returned to frontend
- Company isolation enforced at application and database level
- Webhook signature verification
- File upload validation
- Rate limiting on API endpoints

## Production Deployment

For production:

1. Use a production PostgreSQL database
2. Use a production Redis instance
3. Use AWS S3, Cloudflare R2, or another S3-compatible storage
4. Set up HTTPS with a reverse proxy (nginx)
5. Use strong, unique secrets for JWT and encryption
6. Configure proper CORS origins
7. Set up monitoring and logging
8. Enable PostgreSQL RLS policies

## Troubleshooting

### OAuth callback fails
- Ensure redirect URI matches exactly (including http vs https)
- Check that platform credentials are configured for the company
- Verify the OAuth state parameter is being passed correctly

### Media upload fails
- Check MinIO is running and accessible
- Verify S3 credentials in .env
- Check file size limits (100MB max)

### Publishing fails
- Check that social account is CONNECTED
- Verify OAuth tokens are not expired
- Check BullMQ worker logs for detailed errors
- Verify platform API credentials are valid

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
