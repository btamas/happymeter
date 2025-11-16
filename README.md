# HappyMeter

![CI](https://github.com/btamas/happymeter/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/btamas/happymeter/actions/workflows/codeql.yml/badge.svg)

A customer feedback system with automated sentiment analysis, designed as a Proof of Concept for e-commerce businesses to gather and analyze customer opinions about their products.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Docker Production Setup](#docker-production-setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Security & Performance](#security--performance)
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
- **Docker**: https://localhost:8443/api-docs

## Testing

The project includes comprehensive automated tests for both frontend and backend (62 total tests).

### Running Tests

```bash
# Run all tests (backend + frontend)
npm test

# Run tests in watch mode (backend)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Framework

**Backend:**

- **Test Runner**: Vitest
- **HTTP Testing**: Supertest
- **Database**: PGlite (in-memory PostgreSQL via WASM) - no Docker required!
- **Coverage**: API endpoints, sentiment analysis, validation

**Frontend:**

- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **Coverage**: Form components, admin dashboard, API client functions

**Key Features**:

- No external dependencies - Backend tests use PGlite (in-memory PostgreSQL)
- Fast execution - 62 tests run in ~4 seconds
- Comprehensive coverage - Backend: 88.4%, Frontend: Full component & API coverage
- Colocated tests - Tests live next to the code they test

**Note**: First test run downloads the sentiment analysis model (~500MB), which takes longer. Subsequent runs are fast.

## Security & Performance

### Security Features

**Rate Limiting:**

- Feedback submission endpoint limited to 5 requests per minute per IP
- Prevents spam and abuse
- Returns `429 Too Many Requests` with clear error message

**Request Body Size Limits:**

- Global limit of 100KB for all JSON requests
- Prevents large payload attacks

**Authentication:**

- HTTP Basic Authentication for admin endpoints
- Configurable credentials via environment variables

### Performance Optimizations

**Database Connection Pooling:**

- Minimum 2 connections maintained
- Maximum 20 connections (configurable)
- 30-second idle timeout
- Connection keep-alive enabled

**Database Indexes:**

- `idx_feedback_sentiment`: Speeds up sentiment filtering
- `idx_feedback_created_at`: Optimizes time-based sorting
- `idx_feedback_sentiment_created_at`: Composite index for filtered + sorted queries

**Automatic Triggers:**

- PostgreSQL trigger automatically updates `updated_at` on row modifications

## Project Structure

```
happymeter/
├── README.md                    # This file
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

## Development Commands

### Root Commands

```bash
npm run dev:backend          # Start backend dev server (port 4000)
npm run dev:frontend         # Start frontend dev server (port 5173)
npm run build                # Build both frontend and backend
npm run build:backend        # Build backend only
npm run build:frontend       # Build frontend only
npm run start:prod           # Start with Docker Compose
npm run stop:prod            # Stop Docker Compose
npm test                     # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage report
npm run lint                 # Lint both frontend and backend
npm run lint:fix             # Auto-fix linting issues
npm run format:check         # Check code formatting
npm run format:write         # Auto-format code
```

### Backend Commands

```bash
cd backend
npm run dev                  # Start dev server with hot reload
npm run build                # Compile TypeScript to dist/
npm run start                # Run compiled JavaScript
npm test                     # Run all tests
npm run db:migrate           # Run migrations
npm run db:studio            # Open Drizzle Studio (GUI)
```

### Frontend Commands

```bash
cd frontend
npm run dev                  # Start Vite dev server
npm run build                # Build for production
npm run preview              # Preview production build locally
npm run lint                 # Lint frontend code
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

3. Restart the application for changes to take effect.

**Security Note**: For production deployment, use strong passwords and consider implementing more robust authentication (OAuth, JWT, etc.).

## Contributing

This project was created as a coding assignment. For questions or suggestions, please contact the author.

## License

ISC

## Author

Tamas Besenyei

## Repository

https://github.com/btamas/happymeter
