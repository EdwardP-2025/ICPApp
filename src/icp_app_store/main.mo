import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

shared({ caller = initializer }) actor class ICPAppStore() = {

  // Types
  type AppId = Text;
  type UserId = Principal;
  type AppType = {
    #pwa;
    #native;
    #canister;
    #web;
  };

  type App = {
    id : AppId;
    name : Text;
    description : Text;
    category : Text;
    icon : Text;
    rating : Float;
    downloads : Text;
    url : Text;
    featured : Bool;
    tags : [Text];
    version : Text;
    size : Text;
    developer : Text;
    installType : AppType;
    webUrl : ?Text;
    canisterId : ?Text;
    appStoreId : ?Text;
    pwaManifestUrl : ?Text;
  };

  type InstalledApp = {
    id : AppId;
    name : Text;
    url : Text;
    icon : Text;
    installDate : Int;
    lastUsed : ?Int;
    launchCount : Nat;
    installType : AppType;
    canisterId : ?Text;
    appStoreId : ?Text;
    isFullyInstalled : Bool;
  };

  type UserProfile = {
    userId : UserId;
    nickname : ?Text;
    installedApps : [AppId];
    totalLaunches : Nat;
    lastActive : Int;
  };

  // State
  private stable var apps : [(AppId, App)] = [];
  private var appsMap = HashMap.HashMap<AppId, App>(0, Text.equal, Text.hash);

  private stable var installedApps : [(UserId, [InstalledApp])] = [];
  private var installedAppsMap = HashMap.HashMap<UserId, [InstalledApp]>(0, Principal.equal, Principal.hash);

  private stable var userProfiles : [(UserId, UserProfile)] = [];
  private var userProfilesMap = HashMap.HashMap<UserId, UserProfile>(0, Principal.equal, Principal.hash);

  // Initialize with sample apps
  private func initializeApps() {
    let sampleApps : [App] = [
      {
        id = "dscvr";
        name = "DSCVR";
        description = "Decentralized social media platform";
        category = "social";
        icon = "🌐";
        rating = 4.5;
        downloads = "10K+";
        url = "https://dscvr.one";
        featured = true;
        tags = ["social", "content", "community"];
        version = "2.1.0";
        size = "15.2 MB";
        developer = "DSCVR Team";
        installType = #pwa;
        webUrl = ?"https://dscvr.one";
        canisterId = null;
        appStoreId = null;
        pwaManifestUrl = ?"https://dscvr.one/manifest.json";
      },
      {
        id = "openchat";
        name = "OpenChat";
        description = "Decentralized messaging app";
        category = "social";
        icon = "💬";
        rating = 4.3;
        downloads = "5K+";
        url = "https://oc.app";
        featured = true;
        tags = ["messaging", "chat", "communication"];
        version = "1.8.5";
        size = "12.8 MB";
        developer = "OpenChat Team";
        installType = #pwa;
        webUrl = ?"https://oc.app";
        canisterId = null;
        appStoreId = null;
        pwaManifestUrl = ?"https://oc.app/manifest.json";
      },
      {
        id = "plug-wallet";
        name = "Plug Wallet";
        description = "Cryptocurrency wallet for ICP";
        category = "finance";
        icon = "💰";
        rating = 4.7;
        downloads = "15K+";
        url = "https://plugwallet.ooo";
        featured = true;
        tags = ["wallet", "crypto", "finance"];
        version = "3.2.1";
        size = "8.5 MB";
        developer = "Plug Team";
        installType = #pwa;
        webUrl = ?"https://plugwallet.ooo";
        canisterId = null;
        appStoreId = null;
        pwaManifestUrl = ?"https://plugwallet.ooo/manifest.json";
      },
      {
        id = "nns";
        name = "NNS";
        description = "Network Nervous System governance";
        category = "governance";
        icon = "🏛️";
        rating = 4.6;
        downloads = "8K+";
        url = "https://nns.ic0.app";
        featured = false;
        tags = ["governance", "voting", "icp"];
        version = "1.0.0";
        size = "5.2 MB";
        developer = "DFINITY Foundation";
        installType = #canister;
        webUrl = ?"https://nns.ic0.app";
        canisterId = ?"rrkah-fqaaa-aaaaa-aaaaq-cai";
        appStoreId = null;
        pwaManifestUrl = null;
      },
      {
        id = "internet-identity";
        name = "Internet Identity";
        description = "Secure authentication service";
        category = "security";
        icon = "🔐";
        rating = 4.9;
        downloads = "20K+";
        url = "https://identity.ic0.app";
        featured = true;
        tags = ["authentication", "security", "identity"];
        version = "1.3.4";
        size = "6.7 MB";
        developer = "DFINITY Foundation";
        installType = #canister;
        webUrl = ?"https://identity.ic0.app";
        canisterId = ?"rdmx6-jaaaa-aaaaa-aaadq-cai";
        appStoreId = null;
        pwaManifestUrl = null;
      }
    ];

    for (app in sampleApps.vals()) {
      appsMap.put(app.id, app);
    };
  };

  // System functions
  system func preupgrade() {
    apps := Iter.toArray(appsMap.entries());
    installedApps := Iter.toArray(installedAppsMap.entries());
    userProfiles := Iter.toArray(userProfilesMap.entries());
  };

  system func postupgrade() {
    appsMap := HashMap.fromIter<AppId, App>(apps.vals(), apps.size(), Text.equal, Text.hash);
    installedAppsMap := HashMap.fromIter<UserId, [InstalledApp]>(installedApps.vals(), installedApps.size(), Principal.equal, Principal.hash);
    userProfilesMap := HashMap.fromIter<UserId, UserProfile>(userProfiles.vals(), userProfiles.size(), Principal.equal, Principal.hash);
  };

  // Public functions
  public shared({ caller }) func initialize() : async Bool {
    if (apps.size() == 0) {
      initializeApps();
      return true;
    };
    return false;
  };

  // Get all apps
  public query func getAllApps() : async [App] {
    Iter.toArray(appsMap.vals())
  };

  // Get featured apps
  public query func getFeaturedApps() : async [App] {
    let featured = Buffer.Buffer<App>(0);
    for ((id, app) in appsMap.entries()) {
      if (app.featured) {
        featured.add(app);
      };
    };
    Buffer.toArray(featured)
  };

  // Get apps by category
  public query func getAppsByCategory(category : Text) : async [App] {
    let filtered = Buffer.Buffer<App>(0);
    for ((id, app) in appsMap.entries()) {
      if (app.category == category) {
        filtered.add(app);
      };
    };
    Buffer.toArray(filtered)
  };

  // Install app for user
  public shared({ caller }) func installApp(appId : AppId) : async Result.Result<InstalledApp, Text> {
    switch (appsMap.get(appId)) {
      case null {
        return #err("App not found");
      };
      case (?app) {
        let installedApp : InstalledApp = {
          id = app.id;
          name = app.name;
          url = app.url;
          icon = app.icon;
          installDate = Time.now();
          lastUsed = null;
          launchCount = 0;
          installType = app.installType;
          canisterId = app.canisterId;
          appStoreId = app.appStoreId;
          isFullyInstalled = true;
        };

        // Add to user's installed apps
        let userApps = switch (installedAppsMap.get(caller)) {
          case null { [installedApp] };
          case (?existing) { Array.append(existing, [installedApp]) };
        };
        installedAppsMap.put(caller, userApps);

        // Update user profile
        let profile = switch (userProfilesMap.get(caller)) {
          case null {
            {
              userId = caller;
              nickname = null;
              installedApps = [appId];
              totalLaunches = 0;
              lastActive = Time.now();
            }
          };
          case (?existing) {
            {
              userId = caller;
              nickname = existing.nickname;
              installedApps = Array.append(existing.installedApps, [appId]);
              totalLaunches = existing.totalLaunches;
              lastActive = Time.now();
            }
          };
        };
        userProfilesMap.put(caller, profile);

        return #ok(installedApp);
      };
    };
  };

  // Uninstall app for user
  public shared({ caller }) func uninstallApp(appId : AppId) : async Result.Result<Bool, Text> {
    let userApps = switch (installedAppsMap.get(caller)) {
      case null { return #err("No installed apps found") };
      case (?apps) { apps };
    };

    let filtered = Array.filter<InstalledApp>(userApps, func(app) { app.id != appId });
    installedAppsMap.put(caller, filtered);

    // Update user profile
    let profile = switch (userProfilesMap.get(caller)) {
      case null { return #err("User profile not found") };
      case (?existing) {
        let filteredApps = Array.filter<AppId>(existing.installedApps, func(id) { id != appId });
        {
          userId = caller;
          nickname = existing.nickname;
          installedApps = filteredApps;
          totalLaunches = existing.totalLaunches;
          lastActive = Time.now();
        }
      };
    };
    userProfilesMap.put(caller, profile);

    return #ok(true);
  };

  // Launch app for user
  public shared({ caller }) func launchApp(appId : AppId) : async Result.Result<App, Text> {
    let userApps = switch (installedAppsMap.get(caller)) {
      case null { return #err("No installed apps found") };
      case (?apps) { apps };
    };

    let app = switch (appsMap.get(appId)) {
      case null { return #err("App not found") };
      case (?app) { app };
    };

    // Update launch count and last used
    let updatedApps = Array.map<InstalledApp, InstalledApp>(userApps, func(installedApp) {
      if (installedApp.id == appId) {
        {
          id = installedApp.id;
          name = installedApp.name;
          url = installedApp.url;
          icon = installedApp.icon;
          installDate = installedApp.installDate;
          lastUsed = ?Time.now();
          launchCount = installedApp.launchCount + 1;
          installType = installedApp.installType;
          canisterId = installedApp.canisterId;
          appStoreId = installedApp.appStoreId;
          isFullyInstalled = installedApp.isFullyInstalled;
        }
      } else {
        installedApp
      }
    });
    installedAppsMap.put(caller, updatedApps);

    // Update user profile
    let profile = switch (userProfilesMap.get(caller)) {
      case null { return #err("User profile not found") };
      case (?existing) {
        {
          userId = caller;
          nickname = existing.nickname;
          installedApps = existing.installedApps;
          totalLaunches = existing.totalLaunches + 1;
          lastActive = Time.now();
        }
      };
    };
    userProfilesMap.put(caller, profile);

    return #ok(app);
  };

  // Get user's installed apps
  public shared query({ caller }) func getUserInstalledApps() : async [InstalledApp] {
    switch (installedAppsMap.get(caller)) {
      case null { [] };
      case (?apps) { apps };
    }
  };

  // Get user profile
  public shared query({ caller }) func getUserProfile() : async ?UserProfile {
    userProfilesMap.get(caller)
  };

  // Update user nickname
  public shared({ caller }) func updateUserNickname(nickname : Text) : async Result.Result<UserProfile, Text> {
    let profile = switch (userProfilesMap.get(caller)) {
      case null {
        {
          userId = caller;
          nickname = ?nickname;
          installedApps = [];
          totalLaunches = 0;
          lastActive = Time.now();
        }
      };
      case (?existing) {
        {
          userId = caller;
          nickname = ?nickname;
          installedApps = existing.installedApps;
          totalLaunches = existing.totalLaunches;
          lastActive = Time.now();
        }
      };
    };
    userProfilesMap.put(caller, profile);
    return #ok(profile);
  };

  // Search apps
  public query func searchApps(query : Text) : async [App] {
    let results = Buffer.Buffer<App>(0);
    let queryLower = Text.map(query, Prim.charToLower);
    
    for ((id, app) in appsMap.entries()) {
      let nameLower = Text.map(app.name, Prim.charToLower);
      let descLower = Text.map(app.description, Prim.charToLower);
      
      if (Text.contains(nameLower, #text queryLower) or 
          Text.contains(descLower, #text queryLower)) {
        results.add(app);
      };
    };
    Buffer.toArray(results)
  };

  // Get app statistics
  public query func getAppStats() : async {
    totalApps : Nat;
    totalUsers : Nat;
    totalInstallations : Nat;
  } {
    let totalApps = appsMap.size();
    let totalUsers = userProfilesMap.size();
    var totalInstallations = 0;
    
    for ((userId, profile) in userProfilesMap.entries()) {
      totalInstallations += profile.installedApps.size();
    };
    
    {
      totalApps = totalApps;
      totalUsers = totalUsers;
      totalInstallations = totalInstallations;
    }
  };

  // Add new app dynamically (no re-deployment needed)
  public shared({ caller }) func addNewApp(app : App) : async Result.Result<Bool, Text> {
    // Check if app already exists
    switch (appsMap.get(app.id)) {
      case (?existing) {
        return #err("App with this ID already exists");
      };
      case null {
        appsMap.put(app.id, app);
        return #ok(true);
      };
    };
  };

  // Remove app dynamically
  public shared({ caller }) func removeApp(appId : AppId) : async Result.Result<Bool, Text> {
    switch (appsMap.get(appId)) {
      case null {
        return #err("App not found");
      };
      case (?app) {
        appsMap.delete(appId);
        return #ok(true);
      };
    };
  };

  // Update existing app
  public shared({ caller }) func updateApp(appId : AppId, updatedApp : App) : async Result.Result<Bool, Text> {
    switch (appsMap.get(appId)) {
      case null {
        return #err("App not found");
      };
      case (?existing) {
        appsMap.put(appId, updatedApp);
        return #ok(true);
      };
    };
  };
}; 