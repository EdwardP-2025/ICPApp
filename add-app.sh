#!/bin/bash

# Add New App to ICP App Store Canister
# Usage: ./add-app.sh <app-id> <app-name> <description> <category> <icon> <url>

if [ $# -lt 6 ]; then
    echo "Usage: $0 <app-id> <app-name> <description> <category> <icon> <url> [install-type] [canister-id]"
    echo "Example: $0 'sonic' 'Sonic' 'DeFi platform' 'finance' '⚡' 'https://sonic.ooo' 'pwa'"
    exit 1
fi

APP_ID=$1
APP_NAME=$2
DESCRIPTION=$3
CATEGORY=$4
ICON=$5
URL=$6
INSTALL_TYPE=${7:-"pwa"}
CANISTER_ID=${8:-""}

echo "🚀 Adding new app to ICP App Store..."

# Create the app data
APP_DATA=$(cat <<EOF
{
  "id": "$APP_ID",
  "name": "$APP_NAME",
  "description": "$DESCRIPTION",
  "category": "$CATEGORY",
  "icon": "$ICON",
  "rating": 4.5,
  "downloads": "1K+",
  "url": "$URL",
  "featured": false,
  "tags": ["$CATEGORY", "new"],
  "version": "1.0.0",
  "size": "5.0 MB",
  "developer": "Developer",
  "installType": { "$INSTALL_TYPE": null },
  "webUrl": { "Some": "$URL" },
  "canisterId": $([ -n "$CANISTER_ID" ] && echo "{ \"Some\": \"$CANISTER_ID\" }" || echo "null"),
  "appStoreId": null,
  "pwaManifestUrl": $([ "$INSTALL_TYPE" = "pwa" ] && echo "{ \"Some\": \"$URL/manifest.json\" }" || echo "null")
}
EOF
)

# Add the app to the canister
echo "📱 Adding app: $APP_NAME"
dfx canister call icp_app_store addNewApp "$APP_DATA"

# Verify the app was added
echo "✅ Verifying app was added..."
dfx canister call icp_app_store getAllApps

echo "🎉 App '$APP_NAME' added successfully!"
echo "📋 You can now install it from the mobile app." 