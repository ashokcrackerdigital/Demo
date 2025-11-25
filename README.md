# Healthcare Booking Application

A full-stack, production-ready healthcare booking application built with React, TypeScript, Vite (frontend) and Node.js, Express, TypeScript (backend), using PostgreSQL and Redis.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Locking**: Redis (local)
- **Validation**: Zod
- **Testing**: Vitest

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher) - running locally
- **Redis** (v7 or higher) - running locally

### Installing PostgreSQL (macOS)

```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb healthcare_booking
```

### Installing Redis (macOS)

```bash
# Using Homebrew
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Set Up Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env file with your database and Redis credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/healthcare_booking?schema=public"
# REDIS_URL="redis://localhost:6379"
# PORT=3001
# NODE_ENV=development

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database (generates 15 days of slots)
npx prisma db seed
```

### 3. Set Up Frontend

```bash
cd frontend

# Copy environment template
cp .env.example .env

# Edit .env file if needed
# VITE_API_URL=http://localhost:3001
```

### 4. Run the Application

**एक ही command से Frontend और Backend दोनों start करें:**

Root directory से:

```bash
npm run dev
```

यह automatically:
- ✅ Backend server start करेगा (port 3001)
- ✅ Frontend server start करेगा (port 5173)
- ✅ दोनों एक साथ run होंगे
- ✅ Redis के बिना भी काम करेगा (graceful degradation)

**Access करें:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

**Note:** Redis optional है। अगर Redis नहीं चल रहा है, तो server बिना rate limiting और distributed locking के चलेगा (बाकी features काम करेंगे)।

## 📁 Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── slots.ts
│   │   │   ├── booking.ts
│   │   │   └── admin.ts
│   │   ├── middleware/
│   │   │   ├── rateLimiter.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logger.ts
│   │   ├── services/
│   │   │   ├── slotService.ts
│   │   │   ├── bookingService.ts
│   │   │   └── redisService.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   └── lock.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── tests/
│   │   ├── slotService.test.ts
│   │   ├── bookingService.test.ts
│   │   └── concurrency.test.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Booking.tsx
│   │   │   └── Admin.tsx
│   │   ├── components/
│   │   │   ├── Calendar.tsx
│   │   │   ├── SlotGrid.tsx
│   │   │   ├── BookingModal.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Button.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
└── .github/
    └── workflows/
        └── ci.yml
```

## 🔑 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://username:password@localhost:5432/healthcare_booking?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3001
NODE_ENV=development
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001
```

## 📊 Business Rules

- **100 slots per day** for the next 15 days:
  - 50 ONLINE (bookable any day)
  - 30 EXPRESS SAME-DAY (bookable only today after 06:00 local time)
  - 20 OFFLINE (not bookable online)
- **Facility hours**: 10:00 AM - 5:00 PM
- **10 slots per hour**
- **Booking**: First-Come-First-Served (FCFS) with Redis distributed locking
- Express slots can only be booked after 6:00 AM on the same day

## 🧪 Testing

```bash
cd backend
npm test

# Run specific test file
npm test -- slotService.test.ts
```

## 🔧 Available Scripts

### Root

- `npm run dev` - Run both frontend and backend
- `npm run build` - Build both frontend and backend
- `npm run test` - Run backend tests
- `npm run lint` - Lint both projects

### Backend

- `npm run dev` - Start development server
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code

### Frontend

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## 📝 API Endpoints

### GET /api/slots?date=YYYY-MM-DD
Get available slots for a specific date.

### POST /api/book
Book a slot.
```json
{
  "slotId": 1,
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "patientPhone": "+1234567890"
}
```

### GET /api/admin/slots
Get all slots with booking information (admin only).

### POST /api/admin/slot/override
Override slot availability (admin only).
```json
{
  "slotId": 1,
  "status": "AVAILABLE"
}
```

## 🔒 Rate Limiting

- **5 requests per minute per IP** for all endpoints
- Implemented using Redis

## 🛡️ Security Features

- Rate limiting
- Input validation (Zod)
- SQL injection prevention (Prisma)
- Distributed locking for concurrent bookings
- Audit logging (IP, user-agent, timestamp)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

MIT

## 🐛 Troubleshooting

### PostgreSQL Connection Issues
- Verify PostgreSQL is running: `brew services list | grep postgresql`
- Check connection string in `.env`
- Ensure database exists: `psql -l | grep healthcare_booking`

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping`
- Check Redis URL in `.env`

### Port Already in Use
- Backend default: 3001
- Frontend default: 5173
- Change ports in `.env` files if needed

