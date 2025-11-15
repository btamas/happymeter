# HappyMeter

![CI](https://github.com/btamas/happymeter/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/btamas/happymeter/actions/workflows/codeql.yml/badge.svg)

A customer feedback system with automated sentiment analysis, designed as a Proof of Concept for e-commerce businesses to gather and analyze customer opinions about their products.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Structure](#database-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Docker Production Setup](#docker-production-setup)
- [API Documentation](#api-documentation)
- [Admin Access](#admin-access)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Overview

HappyMeter enables businesses to:

- Collect customer feedback through a simple web form
- Automatically classify feedback sentiment (Good, Bad, or Neutral) using machine learning
- Monitor customer sentiment trends through an admin dashboard
- Make data-driven decisions based on customer opinions

## Features

### Customer Features

- Simple feedback form with 1000 character limit
- Real-time character counter
- Instant sentiment feedback after submission
- Mobile-responsive design

### Admin Features

- Protected admin dashboard with HTTP Basic Authentication
- View all customer feedback with sentiment classifications
- Dashboard statistics (total feedback, breakdown by sentiment)
- Filter feedback by sentiment type (Good/Bad/Neutral)
- Pagination support for large datasets
- Confidence scores for each sentiment classification

### Technical Features

- RESTful API with OpenAPI/Swagger documentation
- Machine learning-based sentiment analysis using Hugging Face transformers
- PostgreSQL database with Drizzle ORM
- Type-safe TypeScript implementation
- Docker containerization with nginx reverse proxy
- Health check endpoints
- Rate limiting (5 requests per minute per IP)
- Request body size limits (100KB max)
- Database connection pooling
- Automatic timestamp updates via database triggers
- Performance-optimized database indexes

## Tech Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Data Fetching**: TanStack React Query
- **Table**: TanStack React Table

### Backend

- **Runtime**: Node.js 22
- **Framework**: Express 4
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database Driver**: node-postgres (pg)
- **Sentiment Analysis**: @xenova/transformers (twitter-roberta-base-sentiment-latest model)
- **API Documentation**: Swagger UI Express

### Database

- **Database**: PostgreSQL 16
- **Schema Management**: Drizzle ORM with migrations

### DevOps

- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx with SSL/HTTPS
- **Package Manager**: npm workspaces (monorepo)

## Architecture

HappyMeter follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React + Vite + TypeScript + Tailwind CSS (Port 5173)      │
│  - Customer Feedback Form (/)                               │
│  - Admin Dashboard (/admin)                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST API (/api/*)
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                         Backend                              │
│  Node.js + Express + TypeScript (Port 4000)                 │
│  - REST API Endpoints                                       │
│  - Sentiment Analysis Service (ML Model)                    │
│  - Authentication Middleware                                │
│  - Database Layer (Drizzle ORM)                             │
└─────────────────────┬───────────────────────────────────────┘
                      │ PostgreSQL Protocol
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                       Database                               │
│  PostgreSQL 16 (Port 5432)                                  │
│  - feedback table                                           │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Sentiment Analysis**: Uses @xenova/transformers with the `twitter-roberta-base-sentiment-latest` model for accurate, local sentiment classification without external API dependencies
2. **Authentication**: HTTP Basic Authentication for admin endpoints - simple, secure, and sufficient for PoC
3. **API Design**: RESTful principles with proper HTTP status codes and pagination
4. **Frontend State**: TanStack Query for server state management with automatic caching and refetching
5. **Type Safety**: TypeScript throughout the stack with shared type definitions

## Database Structure

### Schema

The application uses a single `feedback` table with the following structure:

```sql
CREATE TYPE sentiment_type AS ENUM ('GOOD', 'BAD', 'NEUTRAL');

CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  text VARCHAR(1000) NOT NULL,
  sentiment sentiment_type NOT NULL,
  confidence_score DECIMAL(5,4),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Fields

| Field              | Type          | Description                                           |
| ------------------ | ------------- | ----------------------------------------------------- |
| `id`               | SERIAL        | Auto-incrementing primary key                         |
| `text`             | VARCHAR(1000) | Customer feedback text (max 1000 characters)          |
| `sentiment`        | ENUM          | Sentiment classification: 'GOOD', 'BAD', or 'NEUTRAL' |
| `confidence_score` | DECIMAL(5,4)  | ML model confidence score (0.0000 to 1.0000)          |
| `created_at`       | TIMESTAMP     | When the feedback was submitted                       |
| `updated_at`       | TIMESTAMP     | Last update timestamp                                 |

### Indexes

- Primary key index on `id`
- Index on `sentiment` for faster filtering (`idx_feedback_sentiment`)
- Index on `created_at` for faster sorting (`idx_feedback_created_at`)
- Composite index on `sentiment` and `created_at` for optimized filtered queries (`idx_feedback_sentiment_created_at`)

### Database Triggers

- Automatic `updated_at` timestamp update on row modifications
- PostgreSQL trigger function `update_updated_at_column()` maintains data consistency

## Getting Started

### Prerequisites

- **Node.js**: v22 or higher ([Download](https://nodejs.org/))
- **npm**: v10 or higher (comes with Node.js)
- **Docker & Docker Compose**: For containerized deployment ([Download](https://www.docker.com/))
- **PostgreSQL**: v16 (optional for local development without Docker)

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/btamas/happymeter.git
cd happymeter
```

#### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for both frontend and backend workspaces.

#### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` if needed (default values work for local development):

```env
# Backend Configuration
NODE_ENV=development
PORT=4000

# Database Configuration
DATABASE_URL=postgresql://happymeter:happymeter@localhost:5432/happymeter

# Database Connection Pool (optional - defaults shown)
DB_POOL_MAX=20                 # Maximum pool connections
DB_POOL_MIN=2                  # Minimum pool connections
DB_IDLE_TIMEOUT=30000          # Idle connection timeout (ms)
DB_CONNECTION_TIMEOUT=5000     # Connection timeout (ms)

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

#### 4. Start PostgreSQL Database

Using Docker:

```bash
docker run -d \
  --name happymeter-db \
  -e POSTGRES_USER=happymeter \
  -e POSTGRES_PASSWORD=happymeter \
  -e POSTGRES_DB=happymeter \
  -p 5432:5432 \
  postgres:16-alpine
```

Or use your local PostgreSQL installation and create the database:

```sql
CREATE DATABASE happymeter;
```

#### 5. Run Database Migrations

```bash
cd backend
npm run db:migrate
cd ..
```

This creates:

- The `feedback` table and `sentiment_type` enum
- Automatic `updated_at` trigger for timestamp updates
- Performance indexes on `sentiment`, `created_at`, and composite queries

#### 6. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**

```bash
npm run dev:backend
```

Backend will start at http://localhost:4000

**Terminal 2 - Frontend:**

```bash
npm run dev:frontend
```

Frontend will start at http://localhost:5173

#### 7. Access the Application

- **Customer Form**: http://localhost:5173/
- **Admin Dashboard**: http://localhost:5173/admin
  - Username: `admin`
  - Password: `admin123`
- **API Documentation**: http://localhost:4000/api-docs
- **Health Check**: http://localhost:4000/api/health

### Docker Production Setup

For a production-like environment with nginx reverse proxy and SSL:

#### 1. Generate SSL Certificates (for local HTTPS testing)

```bash
mkdir -p nginx/certs
cd nginx/certs

# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

cd ../..
```

#### 2. Start All Services with Docker Compose

```bash
docker-compose up --build
```

Or use the npm script:

```bash
npm run start:prod
```

**What happens during startup:**

1. **frontend-builder** service builds the React app and outputs to `frontend/dist/`
2. **backend** service builds and starts the Express API
3. **db** service starts PostgreSQL database
4. **nginx** serves the built frontend and proxies API requests to backend

This starts:

- Frontend Builder (builds once, then exits)
- PostgreSQL database (port 5432)
- Backend API (internal port 4000)
- Nginx reverse proxy (ports 8080 for HTTP, 8443 for HTTPS)

#### 3. Access the Application

- **HTTPS**: https://localhost:8443/
- **HTTP**: http://localhost:8080/ (redirects to HTTPS)
- **Admin Dashboard**: https://localhost:8443/admin
- **API**: https://localhost:8443/api/feedback
- **API Docs**: https://localhost:8443/api-docs

**Note**: Your browser will show a security warning for the self-signed certificate. Click "Advanced" and proceed.

#### 4. Stop Services

```bash
docker-compose down
```

Or use the npm script:

```bash
npm run stop:prod
```

### Alternative: Manual Production Build

If you prefer to build manually before running Docker:

```bash
# Option 1: Use the build script
./build-production.sh

# Option 2: Build manually
npm run build:frontend   # Creates frontend/dist/
npm run build:backend    # Creates backend/dist/

# Then start Docker (skips the frontend-builder service)
docker-compose up -d
```

This approach is useful if:

- You want to inspect the build output before deployment
- You're deploying to a different environment
- You want faster Docker startup (no build step)

## API Documentation

### Endpoints

#### POST /api/feedback

Submit customer feedback for sentiment analysis.

**Request:**

```json
{
  "text": "Great product, very satisfied!"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "text": "Great product, very satisfied!",
  "sentiment": "GOOD",
  "confidenceScore": "0.9876",
  "createdAt": "2025-11-15T10:30:00.000Z"
}
```

**Validation:**

- `text` is required
- `text` must not be empty
- `text` must be max 1000 characters

**Rate Limiting:**

- Maximum 5 requests per minute per IP address
- Returns `429 Too Many Requests` when limit exceeded

**Error Responses:**

- `400 Bad Request`: Invalid input (missing text, too long, etc.)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error during processing

#### GET /api/feedback

Retrieve all feedback with sentiment classifications. **Requires authentication.**

**Authentication:**

- HTTP Basic Auth required
- Username: `admin` (configurable via `ADMIN_USERNAME`)
- Password: `admin123` (configurable via `ADMIN_PASSWORD`)

**Query Parameters:**

- `limit` (optional): Number of results per page (default: 20)
- `offset` (optional): Number of results to skip (default: 0)
- `sentiment` (optional): Filter by sentiment - `GOOD`, `BAD`, or `NEUTRAL`

**Request:**

```bash
curl -u admin:admin123 "http://localhost:4000/api/feedback?limit=10&offset=0&sentiment=GOOD"
```

**Response (200 OK):**

```json
{
  "feedback": [
    {
      "id": 1,
      "text": "Great product!",
      "sentiment": "GOOD",
      "confidenceScore": "0.9876",
      "createdAt": "2025-11-15T10:30:00.000Z",
      "updatedAt": "2025-11-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid credentials
- `500 Internal Server Error`: Server error

#### GET /api/health

Health check endpoint to verify backend and database connectivity.

**Response (200 OK):**

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-15T10:30:00.000Z"
}
```

### Interactive API Documentation

Swagger UI is available at `/api-docs` when the backend is running:

- **Local Dev**: http://localhost:4000/api-docs
- **Docker**: https://localhost/api-docs

## Admin Access

The admin dashboard is protected with HTTP Basic Authentication.

### Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

### Changing Admin Credentials

1. **Local Development**: Edit `backend/.env`

   ```env
   ADMIN_USERNAME=your_username
   ADMIN_PASSWORD=your_secure_password
   ```

2. **Docker Production**: Set environment variables before starting

   ```bash
   export ADMIN_USERNAME=your_username
   export ADMIN_PASSWORD=your_secure_password
   docker-compose up
   ```

   Or edit `docker-compose.yml` to set different defaults:

   ```yaml
   environment:
     - ADMIN_USERNAME=${ADMIN_USERNAME:-your_username}
     - ADMIN_PASSWORD=${ADMIN_PASSWORD:-your_secure_password}
   ```

3. Restart the application for changes to take effect.

**Security Note**: For production deployment, use strong passwords and consider implementing more robust authentication (OAuth, JWT, etc.).

## Project Structure

```
happymeter/
├── README.md                    # This file
├── CLAUDE.md                    # AI agent context file
├── package.json                 # Root package.json (npm workspaces)
├── docker-compose.yml           # Docker orchestration
│
├── backend/                     # Backend application
│   ├── src/
│   │   ├── index.ts            # Express server entry point
│   │   ├── routes/
│   │   │   └── feedback.ts     # Feedback API endpoints
│   │   ├── services/
│   │   │   └── sentiment.ts    # Sentiment analysis service
│   │   ├── db/
│   │   │   ├── index.ts        # Database connection
│   │   │   └── schema.ts       # Drizzle ORM schema
│   │   ├── middleware/
│   │   │   └── auth.ts         # Authentication middleware
│   │   └── swagger.ts          # API documentation config
│   ├── drizzle/                # Database migrations
│   ├── Dockerfile              # Backend container image
│   ├── .env.example            # Environment variables template
│   └── package.json            # Backend dependencies
│
├── frontend/                    # Frontend application
│   ├── src/
│   │   ├── App.tsx             # Main app component with routing
│   │   ├── main.tsx            # React entry point
│   │   ├── pages/
│   │   │   ├── FeedbackForm.tsx  # Customer feedback form
│   │   │   └── Admin.tsx         # Admin dashboard
│   │   ├── lib/
│   │   │   ├── api.ts          # API client functions
│   │   │   └── types.ts        # TypeScript type definitions
│   │   └── components/         # Reusable React components
│   ├── vite.config.ts          # Vite configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── package.json            # Frontend dependencies
│
└── nginx/                       # Nginx reverse proxy
    ├── nginx.conf              # Nginx configuration
    └── certs/                  # SSL certificates (generated)
```

## Frontend Build Process

### Development Mode

In development, Vite serves the frontend with hot module replacement:

```bash
npm run dev:frontend
# Frontend runs at http://localhost:5173
# API calls proxied to http://localhost:4000/api
```

### Production Build

The frontend build process compiles TypeScript, bundles with Vite, and outputs optimized static files:

```bash
cd frontend
npm run build
```

**Build output:**

- Location: `frontend/dist/`
- Contents: `index.html`, JavaScript bundles, CSS, assets
- Optimizations: Minification, tree-shaking, code splitting

**Build steps:**

1. TypeScript compilation (`tsc -b`)
2. Vite build (bundling, optimization)
3. Output to `dist/` directory

### Verifying the Build

Preview the production build locally:

```bash
cd frontend
npm run preview
# Serves dist/ at http://localhost:4173
```

### Docker Build Integration

Docker Compose includes a `frontend-builder` service that:

1. Installs npm dependencies in a Node.js container
2. Runs `npm run build`
3. Copies `dist/` contents to the host filesystem
4. Nginx then serves the built files

**Manual build before Docker:**

```bash
npm run build:frontend
docker-compose up nginx backend db
```

**Automatic build with Docker:**

```bash
docker-compose up --build
```

The `frontend-builder` service runs automatically and exits after building.

## Development Commands

### Root Commands

```bash
npm run dev:backend          # Start backend dev server (port 4000)
npm run dev:frontend         # Start frontend dev server (port 5173)
npm run build                # Build both frontend and backend
npm run build:backend        # Build backend only
npm run build:frontend       # Build frontend only (outputs to frontend/dist/)
npm run start:prod           # Start with Docker Compose (auto-builds frontend)
npm run stop:prod            # Stop Docker Compose
npm test                     # Run all backend tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage report
npm run lint                 # Lint both frontend and backend
npm run lint:fix             # Auto-fix linting issues
npm run format:check         # Check code formatting
npm run format:write         # Auto-format code
```

### Build Script

For convenience, use the provided build script:

```bash
./build-production.sh        # Builds both frontend and backend, shows output paths
```

### Backend Commands

```bash
cd backend
npm run dev                  # Start dev server with hot reload
npm run build                # Compile TypeScript to dist/
npm run start                # Run compiled JavaScript
npm test                     # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage report
npm run db:generate          # Generate migration files
npm run db:migrate           # Run migrations
npm run db:push              # Push schema changes
npm run db:studio            # Open Drizzle Studio (GUI)
npm run test:sentiment       # Test sentiment analysis manually
npm run test:db              # Test database connection
```

### Frontend Commands

```bash
cd frontend
npm run dev                  # Start Vite dev server
npm run build                # Build for production
npm run preview              # Preview production build locally
npm run lint                 # Lint frontend code
```

## Testing

HappyMeter includes comprehensive automated tests for **both frontend and backend**, with 62 total tests covering components, API endpoints, and business logic.

### Running Tests

```bash
# Run all tests (backend + frontend)
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run tests in watch mode (backend)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are colocated with the source code they test:

```
backend/src/
├── routes/
│   ├── feedback.ts
│   └── feedback.test.ts        # API endpoint tests (11 tests)
├── services/
│   ├── sentiment.ts
│   └── sentiment.test.ts       # Sentiment analysis tests (9 tests)
│
frontend/src/
├── lib/
│   ├── api.ts
│   └── api.test.ts             # API utility tests (13 tests)
├── pages/
│   ├── FeedbackForm.tsx
│   ├── FeedbackForm.test.tsx   # Form component tests (11 tests)
│   ├── Admin.tsx
│   └── Admin.test.tsx          # Admin dashboard tests (18 tests)
```

### Test Coverage

#### Backend Tests (20 tests)

**API Endpoint Tests** (`routes/feedback.test.ts` - 11 tests):

- ✅ POST /api/feedback - Valid feedback submission
- ✅ POST /api/feedback - Missing text validation
- ✅ POST /api/feedback - Empty text validation
- ✅ POST /api/feedback - Text length validation (>1000 chars)
- ✅ POST /api/feedback - Type validation
- ✅ POST /api/feedback - Exactly 1000 characters accepted
- ✅ GET /api/feedback - Unauthorized access (401)
- ✅ GET /api/feedback - Valid authentication
- ✅ GET /api/feedback - Invalid credentials
- ✅ GET /api/feedback - Pagination support
- ✅ GET /api/feedback - Sentiment filtering

**Sentiment Analysis Tests** (`services/sentiment.test.ts` - 9 tests):

- ✅ Positive text classification
- ✅ Negative text classification
- ✅ Neutral text classification
- ✅ Probability score validation
- ✅ Short text handling
- ✅ Long text handling
- ✅ Score range validation (-10 to +10)
- ✅ Model warmup function
- ✅ Analysis after warmup

#### Frontend Tests (42 tests)

**FeedbackForm Component Tests** (`pages/FeedbackForm.test.tsx` - 11 tests):

- ✅ Renders form with all elements
- ✅ Updates character count as user types
- ✅ Disables submit button when textarea is empty
- ✅ Enables submit button when textarea has text
- ✅ Submits feedback and shows success message for GOOD sentiment
- ✅ Submits feedback and shows success message for BAD sentiment
- ✅ Submits feedback and shows success message for NEUTRAL sentiment
- ✅ Shows error message when submission fails
- ✅ Enforces 1000 character limit
- ✅ Clears success message when submitting new feedback
- ✅ Has link to admin dashboard

**Admin Dashboard Tests** (`pages/Admin.test.tsx` - 18 tests):

- ✅ Renders admin dashboard title and description
- ✅ Shows loading state initially
- ✅ Displays feedback data in table
- ✅ Displays statistics correctly
- ✅ Renders sentiment badges with correct colors
- ✅ Displays confidence scores as percentages
- ✅ Renders filter buttons
- ✅ Filters by GOOD sentiment
- ✅ Filters by BAD sentiment
- ✅ Filters by NEUTRAL sentiment
- ✅ Clears filter when All button clicked
- ✅ Displays pagination information
- ✅ Disables Previous button on first page
- ✅ Disables Next button on last page
- ✅ Navigates to next page
- ✅ Navigates to previous page
- ✅ Shows error message when fetch fails
- ✅ Has link back to feedback form

**API Utility Tests** (`lib/api.test.ts` - 13 tests):

- ✅ Fetches feedback with no parameters
- ✅ Fetches feedback with limit parameter
- ✅ Fetches feedback with offset parameter
- ✅ Fetches feedback with sentiment filter
- ✅ Fetches feedback with all parameters
- ✅ Throws error when fetch response not ok
- ✅ Returns feedback data correctly
- ✅ Submits feedback successfully
- ✅ Throws error when submit response not ok
- ✅ Throws generic error when no message in error response
- ✅ Returns feedback with sentiment analysis
- ✅ Sends correct content-type header
- ✅ Uses POST method

### Test Framework

**Backend:**

- **Test Runner**: Vitest
- **HTTP Testing**: Supertest
- **Database**: PGlite (in-memory PostgreSQL via WASM) - no Docker required!
- **Mocking**: Sentiment service is mocked in API tests for speed
- **Integration Tests**: Sentiment service tests use real ML model

**Frontend:**

- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **User Interaction**: @testing-library/user-event
- **DOM Assertions**: @testing-library/jest-dom
- **API Mocking**: Vitest mocks

**Key Features**:

- ✅ **No external dependencies** - Backend tests use PGlite (in-memory PostgreSQL), no Docker required
- ✅ **Fast execution** - 62 tests run in ~4 seconds
- ✅ **Comprehensive coverage** - Backend: 88.4%, Frontend: Full component & API coverage
- ✅ **Colocated tests** - Tests live next to the code they test
- ✅ **TypeScript** - Fully typed tests catch errors at compile time

### Example Test Run

```bash
$ npm test

# Backend Tests
✓ src/routes/feedback.test.ts (11 tests) 46ms
✓ src/services/sentiment.test.ts (9 tests) 224ms

Test Files  2 passed (2)
     Tests  20 passed (20)
  Duration  963ms

# Frontend Tests
✓ src/lib/api.test.ts (13 tests) 5ms
✓ src/pages/Admin.test.tsx (18 tests) 389ms
✓ src/pages/FeedbackForm.test.tsx (11 tests) 2875ms

Test Files  3 passed (3)
     Tests  42 passed (42)
  Duration  3.96s

Total: 62 tests passed across 5 test files
```

**Note**: First test run downloads the sentiment analysis model (~500MB), which takes longer. Subsequent runs are fast.

## Security & Performance

### Security Features

**Rate Limiting:**

- Feedback submission endpoint limited to 5 requests per minute per IP
- Prevents spam and abuse
- Disabled automatically in test environment
- Returns `429 Too Many Requests` with clear error message

**Request Body Size Limits:**

- Global limit of 100KB for all JSON requests
- Prevents large payload attacks
- Configured via Express middleware

**Authentication:**

- HTTP Basic Authentication for admin endpoints
- Configurable credentials via environment variables
- Browser native authentication dialog

### Performance Optimizations

**Database Connection Pooling:**

- Minimum 2 connections maintained
- Maximum 20 connections (configurable)
- 30-second idle timeout
- Connection keep-alive enabled
- Prevents connection exhaustion

**Database Indexes:**

- `idx_feedback_sentiment`: Speeds up sentiment filtering
- `idx_feedback_created_at`: Optimizes time-based sorting
- `idx_feedback_sentiment_created_at`: Composite index for filtered + sorted queries
- Significantly improves admin dashboard query performance

**Automatic Triggers:**

- PostgreSQL trigger automatically updates `updated_at` on row modifications
- Ensures data consistency without application logic
- Zero performance overhead for reads

### Configuration

All security and performance features are configurable via environment variables:

```env
# Rate limiting (applied per IP address)
# Note: Rate limit is hardcoded to 5 requests per minute in code

# Database connection pool
DB_POOL_MAX=20                 # Maximum connections
DB_POOL_MIN=2                  # Minimum connections
DB_IDLE_TIMEOUT=30000          # Idle timeout (30 seconds)
DB_CONNECTION_TIMEOUT=5000     # Connection timeout (5 seconds)

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Sentiment Analysis Details

HappyMeter uses the `@xenova/transformers` library with the `twitter-roberta-base-sentiment-latest` model:

- **Model**: Hugging Face's RoBERTa model fine-tuned on Twitter data
- **Classification**: 3 categories (Positive, Negative, Neutral) mapped to (GOOD, BAD, NEUTRAL)
- **Confidence Scores**: Probability distribution for each category
- **Performance**: Model is cached after first load for faster subsequent predictions
- **Local Execution**: No external API calls required - runs entirely on your server

### Sentiment Mapping

| Model Output | HappyMeter Classification |
| ------------ | ------------------------- |
| positive     | GOOD                      |
| negative     | BAD                       |
| neutral      | NEUTRAL                   |

## Contributing

This project was created as a coding assignment. For questions or suggestions, please contact the author.

## License

ISC

## Author

Tamas Besenyei

## Repository

https://github.com/btamas/happymeter
