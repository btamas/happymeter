# HappyMeter

> **AI Agent Context**: This is a customer feedback system with sentiment analysis built as a coding assignment. Key constraints: max 1000 char feedback, Good/Bad/Neutral classification, React frontend, Node.js backend, PostgreSQL database. Deadline: November 17th, 2025.

## Project Status

- **Current State**: Initial setup - repository created, documentation complete
- **Next Steps**: Implement backend API, database schema, then frontend
- **Repository**: https://github.com/btamas/happymeter
- **Branch**: main

## Project Overview

HappyMeter is a customer feedback system with sentiment analysis designed as a Proof of Concept for e-commerce businesses. It allows customers to submit feedback about products and provides business insights through automated sentiment classification.

### Purpose

- **Customer Feedback Collection**: Enables customers to share their product experiences via a simple web form
- **Sentiment Analysis**: Automatically classifies feedback as Good, Bad, or Neutral using AI/ML services
- **Business Intelligence**: Provides admins with consolidated view of customer sentiment trends
- **E-commerce Integration**: Designed to integrate with existing e-commerce platforms for product feedback

### Core Features

- **Customer Feedback Form**: Simple text input (max 1000 characters) for product reviews
- **Automated Sentiment Analysis**: Real-time classification of feedback sentiment
- **Admin Dashboard**: View all feedback with sentiment scores and analytics
- **RESTful API**: Backend services for feedback submission and retrieval
- **Responsive Design**: Works across desktop and mobile devices

### Target Users

- **Customers**: Submit product feedback and reviews
- **Business Admins**: Monitor customer sentiment and product performance
- **E-commerce Managers**: Gain insights into product reception and customer satisfaction

## Tech Stack

> **Implementation Priority**: Core functionality first, then cloud deployment, then bonus features.

- **Frontend:** React 18 + Vite 5 + TypeScript + Tailwind CSS
  - Dev port: **5173**
  - API calls path: **/api/** (Vite proxy in dev; same path in prod)
- **Backend:** Node.js 22 + Express + TypeScript
  - Dev port: **4000** (Cloud Run uses **8080**)
  - REST base path: **/api**
- **ORM:** Drizzle ORM (`drizzle-orm`) with `pg` (node-postgres)
- **Database:** PostgreSQL
  - Local: Docker (Compose service: **db**)
  - Cloud: Cloud SQL for PostgreSQL (GCP)
- **Containerization:** Docker + Docker Compose (frontend, backend, db)
- **Styling:** Tailwind CSS (utility-first)
- **Package manager:** npm
- **Lint/Format:** ESLint + Prettier

---

**Conventions (minimal):**

- API base path is **/api**; frontend calls use relative `/api/...`.
- Tailwind used for all styling; no additional UI kits by default.

## API Endpoints

### Customer Feedback

- **POST /api/feedback**
  - Submit customer feedback (max 1000 characters)
  - Returns sentiment analysis result (Good/Bad/Neutral)
  - Stores feedback and sentiment in database

- **GET /api/feedback**
  - Retrieve all stored feedback with sentiment classifications
  - Admin endpoint for dashboard view
  - Returns: feedback text, sentiment, timestamp, ID

## Database Schema

### feedback table

```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  text VARCHAR(1000) NOT NULL,
  sentiment VARCHAR(20) NOT NULL, -- 'Good', 'Bad', 'Neutral'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Application Structure

### Frontend Pages

- **Customer Feedback Form** (`/`) - Public form for feedback submission
- **Admin Dashboard** (`/admin`) - View all feedback with sentiment analysis

### Backend Services

- **Feedback Controller** - Handle CRUD operations for feedback
- **Sentiment Service** - Integrate with sentiment analysis API/library
- **Database Layer** - Drizzle ORM with PostgreSQL

## Development Setup

### Prerequisites

- Node.js 22+
- Docker & Docker Compose
- npm

### Local Development

```bash
# Clone repository
git clone https://github.com/btamas/happymeter.git
cd happymeter

# Start database
docker-compose up -d db

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev:backend  # Port 4000
npm run dev:frontend # Port 5173
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/happymeter
SENTIMENT_API_KEY=your_sentiment_service_key
NODE_ENV=development
PORT=4000
```

## Deployment

### Cloud Platform (GCP)

- **Frontend**: Static hosting or Cloud Run
- **Backend**: Cloud Run (port 8080)
- **Database**: Cloud SQL for PostgreSQL
- **Sentiment Analysis**: Google Cloud Natural Language API

### Production Build

```bash
npm run build
npm run deploy
```

## Assignment Completion

### Core Requirements ✅

- [x] REST API for feedback submission (max 1000 chars)
- [x] Sentiment analysis (Good/Bad/Neutral classification)
- [x] Database storage of feedback and sentiment
- [x] REST API to retrieve all feedback
- [x] Customer feedback form
- [x] Admin view with sentiment results

### Bonus Features

- [ ] Cloud deployment (GCP)
- [ ] CI/CD pipeline
- [ ] Infrastructure as Code
- [ ] Admin authentication/authorization

## Testing

### API Testing

```bash
# Test feedback submission
curl -X POST http://localhost:4000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"text": "Great product, very satisfied!"}'

# Test feedback retrieval
curl http://localhost:4000/api/feedback
```

## Sentiment Analysis Integration

Using cloud-based sentiment analysis service for accurate classification:

- **Service**: Google Cloud Natural Language API / AWS Comprehend / Azure Text Analytics
- **Classification**: Simple Good/Bad/Neutral mapping
- **Fallback**: Local sentiment analysis library for development

## Development Workflow for AI Agents

### File Organization

```
happymeter/
├── claude.md              # This context file
├── package.json           # Project dependencies
├── frontend/              # React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Customer form, Admin dashboard
│   │   └── services/      # API calls
├── backend/               # Node.js API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   └── utils/         # Sentiment analysis
├── database/              # SQL migrations
└── docker-compose.yml     # Local development
```

### Implementation Order

1. **Database Setup**: PostgreSQL schema, Drizzle ORM config
2. **Backend API**: Express server, feedback endpoints
3. **Sentiment Service**: Integration with sentiment analysis
4. **Frontend**: React components for form and admin view
5. **Testing**: API tests, end-to-end validation
6. **Deployment**: Docker, cloud deployment (bonus)

### Key Decisions for AI Agents

- **Sentiment Library**: Use `sentiment` npm package for simplicity
- **Database**: Single `feedback` table with text, sentiment, timestamps
- **Authentication**: Skip for MVP, add as bonus feature
- **Styling**: Tailwind utility classes, mobile-first responsive

---
