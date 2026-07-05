#!/bin/bash
set -e

echo "🔨 Building Haraj for Netlify..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build the project
echo "🏗️ Building Next.js..."
npm run build:prod

echo "✅ Build complete!"
