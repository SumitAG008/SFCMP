#!/bin/bash

# SAP BTP Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-development}

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Check if CF CLI is installed
if ! command -v cf &> /dev/null; then
    echo "❌ Cloud Foundry CLI not found. Please install it first."
    exit 1
fi

# Check if MBT is installed
if ! command -v mbt &> /dev/null; then
    echo "📦 Installing MTA Build Tool..."
    npm install -g mbt
fi

# Build MTA archive
echo "📦 Building MTA archive..."
mbt build

# Get the MTA archive name
MTA_FILE=$(ls -t mta_archives/*.mtar | head -1)
echo "📦 MTA Archive: $MTA_FILE"

# Deploy to Cloud Foundry
echo "🚀 Deploying to Cloud Foundry..."
cf deploy "$MTA_FILE"

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Check application status: cf apps"
echo "2. View logs: cf logs compensation-service --recent"
echo "3. Get application URL: cf apps"
