# SmartAgri — Telangana Farmer Market Intelligence Platform

**SIH Problem Statement 26132** — Strengthening market linkages and price discovery for farmers.

## Overview

SmartAgri helps Telangana farmers make data-driven selling decisions by providing:
- **Market Intelligence**: Compare markets by estimated net realization
- **Price Prediction**: ML-based 1-7 day price forecasts
- **Sell/Hold Recommendations**: Should I sell now or wait?
- **Buyer Matching**: Find verified buyers ranked by compatibility
- **AI Assistant**: Ask questions in English or Telugu

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL |
| ML | XGBoost, scikit-learn |
| AI | Sarvam AI (Telugu + English) |
| Infra | Docker Compose |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Option 1: Docker (Recommended)

```bash
cp .env.example .env
# Edit .env with your API keys

docker-compose up --build
```

Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs

### Option 2: Local Development

**Database:**
```bash
docker-compose up db
```

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed demo data
python -m seeds.seed_demo_data

# Start server
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Farmer | farmer@demo.com | demo1234 |
| Buyer | buyer@demo.com | demo1234 |
| Admin | admin@demo.com | admin1234 |

## Environment Variables

See `.env.example` for all configuration options.

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| SECRET_KEY | Yes | JWT signing key |
| SARVAM_API_KEY | For AI assistant | Sarvam AI API key |
| DEMO_MODE | No | Enable demo data (default: true) |

## Project Structure

```
smartgri/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # API route handlers
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── ml/       # ML pipeline
│   ├── seeds/        # Demo data scripts
│   └── tests/        # Backend tests
├── frontend/         # Next.js frontend
│   └── src/
│       ├── app/      # Pages (App Router)
│       ├── components/
│       ├── lib/      # API client, utils
│       ├── hooks/    # React hooks
│       └── types/    # TypeScript types
└── docker-compose.yml
```

## Data Disclaimer

⚠️ This prototype uses **simulated demo data** for Telangana markets. All prices, buyers, and transactions shown are for demonstration purposes only. Data marked with source "DEMO" is not real market data.

## License

MIT
