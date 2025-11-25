# Healthcare Booking Application

A full-stack, production-ready healthcare booking application built with React, TypeScript, Vite (frontend) and Node.js, Express, TypeScript (backend), using PostgreSQL and Redis.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Locking**: Redis (local, optional)
- **Validation**: Zod
- **Testing**: Vitest

---

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **PostgreSQL** (v14 or higher) - Running locally
- **Redis** (v7 or higher) - Running locally (optional, but recommended)

### Installing PostgreSQL (macOS)

```bash
# Using Homebrew
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
createdb healthcare_booking

# Verify database exists
psql -l | grep healthcare_booking
```

### Installing Redis (macOS) - Optional

```bash
# Using Homebrew
brew install redis

# Start Redis service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

**Note:** Redis is optional. If Redis is not running, the app will work without rate limiting and distributed locking.

---

## 🚀 First Time Setup (Step-by-Step)

### Step 1: Open Project Directory

### Step 2: Install Root Dependencies

```bash
# Install root dependencies (concurrently for running both servers)
npm install
```

### Step 3: Install All Workspace Dependencies

```bash
# Install dependencies for both backend and frontend
npm run install:all
```

यह command automatically:
- ✅ Root dependencies install करेगा
- ✅ Backend dependencies install करेगा
- ✅ Frontend dependencies install करेगा

### Step 4: Setup Backend Environment

```bash
# Go to backend directory
cd backend

# Create .env file (if it doesn't exist)
# Copy this content to backend/.env:

# DATABASE_URL="postgresql://ashok@localhost:5432/healthcare_booking?schema=public"
# REDIS_URL="redis://localhost:6379"
# PORT=3001
# NODE_ENV=development

# Or create file manually with above content
```

**Important:** Replace `ashok` in DATABASE_URL with your PostgreSQL username if different.

### Step 5: Setup Database (Prisma)

```bash
# Make sure you're in backend directory
cd backend

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database (creates 15 days of slots)
npx prisma db seed
```

✅ अगर सब कुछ successful है, तो आपको message दिखेगा: "✅ Database seeded successfully!"

### Step 6: Setup Frontend Environment (Optional)

```bash
# Go to frontend directory
cd frontend

# Frontend .env file is optional
# Default API URL is: http://localhost:3001
# If you need to change it, create frontend/.env with:
# VITE_API_URL=http://localhost:3001
```

---

## 🎯 Running the Application

### **✅ One Command to Run Everything**

**📍 Location: Root directory (`/Users/ashok/Desktop/Work/Demo`)**

```bash
# Make sure you're in the root directory
cd /Users/ashok/Desktop/Work/Demo

# Run both frontend and backend together
npm run dev
```

यह एक ही command:
- ✅ Backend server start करेगा (port 3001 पर)
- ✅ Frontend server start करेगा (port 5173 पर)
- ✅ दोनों एक साथ run होंगे
- ✅ Output अलग-अलग colors में दिखेगा

### **Access the Application**

After running `npm run dev`, open your browser:

- **🌐 Frontend (Main App)**: http://localhost:5173
- **🔧 Backend API**: http://localhost:3001
- **❤️ Health Check**: http://localhost:3001/health

---

## 📁 Project Structure

```
Demo/
├── backend/              # Backend code
│   ├── src/             # Source files
│   ├── prisma/          # Database schema & migrations
│   ├── tests/           # Test files
│   ├── .env             # Backend environment variables
│   └── package.json
├── frontend/            # Frontend code
│   ├── src/             # Source files
│   ├── .env             # Frontend environment variables (optional)
│   └── package.json
├── package.json         # Root package.json
└── README.md           # This file
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://ashok@localhost:5432/healthcare_booking?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3001
NODE_ENV=development
```

**Important:** Replace `ashok` with your PostgreSQL username.

### Frontend (`frontend/.env` - Optional)

```env
VITE_API_URL=http://localhost:3001
```

---

## 📊 Features

### Booking System

- ✅ **Calendar-based booking**: Select a date and auto-assign next available slot
- ✅ **50 online slots per day**: First slot at 10:00 AM, then 10:04, 10:08... (4-minute intervals)
- ✅ **Auto slot assignment**: System automatically assigns next available slot
- ✅ **Slot availability check**: Shows offline booking message if >80 slots booked
- ✅ **Success popup**: Shows assigned time slot after booking

### Admin Panel

- ✅ **Slot Management**: View all booked slots
- ✅ **Date filtering**: Filter slots by date (default: today)
- ✅ **Slot override**: Admin can override slot status

---

## 🛠️ Available Commands

### Root Directory Commands

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend (🚀 USE THIS!)
npm run dev

# Build both projects
npm run build

# Run tests
npm run test

# Run linter
npm run lint
```

### Backend Commands (from `backend/` directory)

```bash
cd backend

# Run backend only
npm run dev

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Run tests
npm test
```

### Frontend Commands (from `frontend/` directory)

```bash
cd frontend

# Run frontend only
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔒 Rate Limiting

- **5 requests per minute per IP** for all endpoints
- Implemented using Redis
- Works without Redis too (rate limiting disabled)

---

## 🐛 Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Check if database exists
psql -l | grep healthcare_booking

# If database doesn't exist, create it
createdb healthcare_booking

# Check connection
psql -d healthcare_booking -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if not running
brew services start redis
```

**Note:** App works without Redis, but rate limiting and distributed locking will be disabled.

### Port Already in Use

```bash
# Check what's using port 3001 (backend)
lsof -i :3001

# Check what's using port 5173 (frontend)
lsof -i :5173

# Kill process if needed
kill -9 <PID>
```

### Dependencies Issues

```bash
# Clean install all dependencies
rm -rf node_modules backend/node_modules frontend/node_modules package-lock.json
npm run install:all
```

### Database Issues

```bash
cd backend

# Reset database (⚠️ This will delete all data!)
npx prisma migrate reset

# Re-seed database
npx prisma db seed
```

---

## 📝 API Endpoints

### GET /api/slots?date=YYYY-MM-DD
Get available slots for a specific date.

### POST /api/book/by-date
Book a slot by date (auto-assigns next available slot).
```json
{
  "date": "2025-11-25",
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "patientPhone": "+91 98765 43210"
}
```

### GET /api/admin/slots?date=YYYY-MM-DD
Get all booked slots for a specific date (admin only).

### POST /api/admin/slot/override
Override slot status (admin only).
```json
{
  "slotId": 1,
  "status": "AVAILABLE"
}
```

---

## ✅ Quick Checklist

First time setup के बाद, verify करें:

- [ ] PostgreSQL running है (`brew services list | grep postgresql`)
- [ ] Database `healthcare_booking` exists है
- [ ] Backend `.env` file में correct DATABASE_URL है
- [ ] Prisma migrations run हो गए हैं
- [ ] Database seed successful है
- [ ] Redis running है (optional)
- [ ] Root directory से `npm run dev` command काम कर रही है

---

## 📄 License

MIT

---

## 🆘 Need Help?

If you face any issues:

1. Check the **Troubleshooting** section above
2. Verify all prerequisites are installed
3. Check if PostgreSQL and Redis are running
4. Verify `.env` files have correct values
5. Try clean install: `rm -rf node_modules && npm run install:all`

---

**🎉 Happy Coding!**
