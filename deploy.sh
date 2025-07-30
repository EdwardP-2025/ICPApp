#!/bin/bash

# ICP App Store Deployment Script

echo "🚀 Deploying ICP App Store to Internet Computer..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install dfx first."
    echo "Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "dfx.json" ]; then
    echo "❌ dfx.json not found. Please run this script from the project root."
    exit 1
fi

# Start local network (if not already running)
echo "📡 Starting local network..."
dfx start --background --clean

# Wait for network to be ready
echo "⏳ Waiting for network to be ready..."
sleep 10

# Deploy canisters
echo "🔧 Deploying canisters..."
dfx deploy

# Initialize the app store
echo "🎯 Initializing app store..."
dfx canister call icp_app_store initialize

# Get canister IDs
echo "📋 Canister IDs:"
dfx canister id icp_app_store
dfx canister id icp_app_store_assets

# Test the deployment
echo "🧪 Testing deployment..."
dfx canister call icp_app_store getAllApps
dfx canister call icp_app_store getAppStats

echo "✅ Deployment complete!"
echo "🌐 Local network: http://localhost:8000"
echo "📱 App Store Canister: $(dfx canister id icp_app_store)" 