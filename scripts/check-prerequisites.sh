#!/bin/bash

# Check prerequisites for Healthcare Booking Application

echo "🔍 Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm installed: $NPM_VERSION"
else
    echo "❌ npm is not installed. Please install npm v9 or higher."
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo "✅ PostgreSQL installed: $PSQL_VERSION"
else
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL v14 or higher."
    exit 1
fi

# Check if PostgreSQL is running
if pg_isready &> /dev/null; then
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  PostgreSQL is not running. Please start it with: brew services start postgresql@14"
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version | awk '{print $2}')
    echo "✅ Redis installed: $REDIS_VERSION"
    
    # Check if Redis is running
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running. Please start it with: brew services start redis"
    fi
else
    echo "❌ Redis is not installed. Please install Redis v7 or higher."
    exit 1
fi

echo ""
echo "✅ All prerequisites check complete!"

