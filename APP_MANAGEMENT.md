# 📱 App Management Guide

## **🔄 No Re-deployment Required!**

You can add, remove, and update apps **without re-deploying** the canister. The system is designed to be dynamic and flexible.

## **➕ Adding New Apps**

### **Method 1: Using the Script**
```bash
# Add a PWA app
./add-app.sh "sonic" "Sonic" "DeFi platform" "finance" "⚡" "https://sonic.ooo" "pwa"

# Add a canister app
./add-app.sh "ic-dashboard" "IC Dashboard" "Internet Computer dashboard" "tools" "📊" "https://dashboard.internetcomputer.org" "canister" "rdmx6-jaaaa-aaaaa-aaadq-cai"

# Add a native app
./add-app.sh "metamask" "MetaMask" "Ethereum wallet" "finance" "🦊" "https://metamask.io" "native"
```

### **Method 2: Direct Canister Call**
```bash
# Add app directly via dfx
dfx canister call icp_app_store addNewApp '(
  record {
    id = "new-app";
    name = "New App";
    description = "A new app";
    category = "social";
    icon = "🎉";
    rating = 4.5;
    downloads = "1K+";
    url = "https://example.com";
    featured = false;
    tags = vec { "social"; "new" };
    version = "1.0.0";
    size = "5.0 MB";
    developer = "Developer";
    installType = variant { pwa };
    webUrl = opt "https://example.com";
    canisterId = null;
    appStoreId = null;
    pwaManifestUrl = opt "https://example.com/manifest.json";
  }
)'
```

## **➖ Removing Apps**

```bash
# Remove an app
dfx canister call icp_app_store removeApp '("app-id")'
```

## **✏️ Updating Apps**

```bash
# Update an existing app
dfx canister call icp_app_store updateApp '(
  "app-id",
  record {
    id = "app-id";
    name = "Updated App Name";
    description = "Updated description";
    category = "updated-category";
    icon = "🔄";
    rating = 4.8;
    downloads = "2K+";
    url = "https://updated-url.com";
    featured = true;
    tags = vec { "updated"; "featured" };
    version = "2.0.0";
    size = "6.0 MB";
    developer = "Updated Developer";
    installType = variant { pwa };
    webUrl = opt "https://updated-url.com";
    canisterId = null;
    appStoreId = null;
    pwaManifestUrl = opt "https://updated-url.com/manifest.json";
  }
)'
```

## **📊 Checking App Status**

```bash
# Get all apps
dfx canister call icp_app_store getAllApps

# Get featured apps
dfx canister call icp_app_store getFeaturedApps

# Get apps by category
dfx canister call icp_app_store getAppsByCategory '("finance")'

# Search apps
dfx canister call icp_app_store searchApps '("wallet")'

# Get app statistics
dfx canister call icp_app_store getAppStats
```

## **🎯 App Types Supported**

### **PWA Apps:**
- **Install Type**: `{ pwa }`
- **Features**: Offline support, app-like experience
- **Example**: DSCVR, OpenChat, Plug Wallet

### **Native Apps:**
- **Install Type**: `{ native }`
- **Features**: App store integration, deep linking
- **Example**: MetaMask

### **Canister Apps:**
- **Install Type**: `{ canister }`
- **Features**: Internet Computer integration
- **Example**: NNS, Internet Identity

### **Web Apps:**
- **Install Type**: `{ web }`
- **Features**: Browser-based apps
- **Example**: Any web application

## **📱 Mobile App Integration**

The mobile app automatically:
1. **Fetches app list** from the canister
2. **Shows real-time updates** when apps are added/removed
3. **Handles installation** based on app type
4. **Tracks usage** and updates statistics

## **🔧 Advanced Management**

### **Batch Operations:**
```bash
# Add multiple apps at once
for app in apps/*.json; do
  dfx canister call icp_app_store addNewApp "$(cat $app)"
done
```

### **Backup and Restore:**
```bash
# Export all apps
dfx canister call icp_app_store getAllApps > apps_backup.json

# Import apps (would need custom function)
# dfx canister call icp_app_store importApps "$(cat apps_backup.json)"
```

## **🚀 Production Workflow**

1. **Add new app** using script or direct call
2. **Test installation** in mobile app
3. **Monitor usage** via statistics
4. **Update app** if needed
5. **Remove app** if deprecated

## **✅ Benefits of This System**

- **No downtime** - Apps can be added/removed instantly
- **Real-time updates** - Mobile app sees changes immediately
- **Flexible management** - Easy to add new app types
- **Scalable** - Can handle thousands of apps
- **Decentralized** - All data stored on Internet Computer

---

**🎉 You can now manage your app store dynamically without any re-deployment!** 