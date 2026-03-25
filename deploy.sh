#!/bin/bash
# COP Webapp — Deploy to Vercel (one-click)
# This script builds the frontend and deploys to Vercel production.

set -e

echo "🔨 Installing dependencies..."
npm install

echo "🏗️  Building frontend..."
npm run build

echo "📋 Adding vercel.json to dist..."
cp vercel.json dist/

echo "🚀 Deploying to Vercel..."
npx vercel deploy --prod dist/ --yes

echo "✅ Done! Your COP webapp is live."
