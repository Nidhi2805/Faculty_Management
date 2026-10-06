#!/bin/bash
# Faculty Leave Management System - Automated Setup Script
# Run: bash setup.sh

set -e

echo ""
echo "🎓 Faculty Leave Management System — Setup"
echo "============================================"
echo ""

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1  || { echo "❌ npm is required."; exit 1; }
command -v mysql >/dev/null 2>&1 || { echo "⚠️  MySQL client not found in PATH. Ensure MySQL is running."; }

echo "📦 Node.js: $(node --version)"
echo "📦 npm:     $(npm --version)"
echo ""

# MySQL setup
echo "🗄️  Setting up MySQL database..."
read -p "MySQL root password (leave blank if none): " -s MYSQL_PASS
echo ""

if [ -z "$MYSQL_PASS" ]; then
  MYSQL_CMD="mysql -u root"
else
  MYSQL_CMD="mysql -u root -p${MYSQL_PASS}"
fi

$MYSQL_CMD -e "CREATE DATABASE IF NOT EXISTS faculty_leave_mgmt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null && echo "✅ Database created/verified" || echo "⚠️  Database creation failed — ensure MySQL is running"

# Backend setup
echo ""
echo "🔧 Installing backend dependencies..."
cd backend
npm install --silent
echo "✅ Backend dependencies installed"

# Create .env
if [ ! -f .env ]; then
  cp .env.example .env
  # Update password in .env
  if [ -n "$MYSQL_PASS" ]; then
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${MYSQL_PASS}/" .env
  fi
  echo "✅ .env file created from .env.example"
else
  echo "ℹ️  .env already exists, skipping..."
fi

cd ..

# Frontend setup
echo ""
echo "⚛️  Installing frontend dependencies..."
cd frontend
npm install --silent
echo "✅ Frontend dependencies installed"
cd ..

echo ""
echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "▶️  START BACKEND:  cd backend && npm run dev"
echo "▶️  START FRONTEND: cd frontend && npm start"
echo ""
echo "🔑 Demo Credentials (password: Password@123)"
echo "   Admin:   admin@college.edu"
echo "   HOD:     hod.cs@college.edu"
echo "   Faculty: amit.sharma@college.edu"
echo ""
echo "🌐 App URL:  http://localhost:3000"
echo "🔌 API URL:  http://localhost:5000/api/health"
echo ""
