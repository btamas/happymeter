#!/bin/bash

set -e

echo "🏗️  Building HappyMeter for production..."
echo ""

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🎨 Building frontend..."
cd frontend
npm run build
cd ..

echo ""
echo "🔧 Building backend..."
cd backend
npm run build
cd ..

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "Frontend build: ./frontend/dist/"
echo "Backend build: ./backend/dist/"
echo ""
echo "To start with Docker:"
echo "  docker-compose up -d"
echo ""
echo "To start locally:"
echo "  npm run dev:backend   # Terminal 1"
echo "  npm run dev:frontend  # Terminal 2"
