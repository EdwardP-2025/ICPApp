# ICP App - Internet Computer Mobile Application

## 📱 Introduction

ICP App is a comprehensive mobile application built for the Internet Computer (IC) ecosystem. This React Native application provides users with a complete ICP wallet experience, including real Internet Identity authentication, ICP balance management, transaction history, and a decentralized app store.

### 🌟 Key Features

- **🔐 Real Internet Identity Integration** - Authenticate with real Internet Identity principals
- **💰 ICP Wallet Management** - View real ICP balances and transaction history
- **📤 Send/Receive ICP** - Transfer ICP to other principals on the IC
- **🛒 Decentralized App Store** - Discover and install dApps on the Internet Computer
- **👤 User Profile Management** - Edit profile, manage preferences, and device binding
- **🌐 Cross-Platform** - Works on both iOS and Android devices

### 🏗️ Architecture

- **Frontend**: React Native with TypeScript
- **Backend**: Internet Computer (IC) with Motoko canisters
- **Authentication**: Internet Identity (II)
- **Wallet**: Real ICP integration with IC mainnet
- **App Store**: Decentralized application discovery and installation

## 🚀 Installation

### Prerequisites

- Node.js (v16 or higher)
- React Native development environment
- DFX (Internet Computer SDK)
- Internet Identity account

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/icp-app.git
cd icp-app
```

### Step 2: Install Dependencies

```bash
# Install React Native dependencies
npm install

# Install DFX (if not already installed)
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

### Step 3: Deploy Backend Canisters

```bash
# Start local IC replica
dfx start --background

# Deploy canisters
dfx deploy

# Get canister IDs
dfx canister id icp_app_store
```

### Step 4: Configure Environment

Create a `.env` file in the root directory:

```env
# Internet Computer Configuration
IC_HOST=https://ic0.app
II_URL=https://identity.ic0.app

# Canister IDs (replace with your deployed canister IDs)
ICP_APP_STORE_CANISTER_ID=your_canister_id_here

# App Configuration
APP_NAME=ICP App
APP_VERSION=1.0.0
```

### Step 5: Run the Application

```bash
# For Android
npx react-native run-android

# For iOS
npx react-native run-ios
```

## 🔧 Development

### Project Structure

```
ICPApp/
├── src/
│   ├── components/          # React Native components
│   ├── contexts/           # React contexts (User, Network)
│   ├── screens/           # App screens
│   ├── services/          # Business logic services
│   └── types/             # TypeScript type definitions
├── android/               # Android-specific files
├── ios/                   # iOS-specific files
├── dfx.json              # DFX configuration
├── canister_ids.json     # Deployed canister IDs
└── README.md             # This file
```

### Key Components

- **InternetIdentityService**: Handles II authentication
- **ICPWalletService**: Manages ICP wallet operations
- **AppInstallationService**: Manages dApp installations
- **UserContext**: Global user state management

### Testing

```bash
# Run tests
npm test

# Run specific test
npm test -- --testNamePattern="Internet Identity"
```

## 🌐 Deployment

### Deploy to IC Mainnet

```bash
# Deploy to mainnet
dfx deploy --network ic

# Update canister_ids.json with mainnet IDs
dfx canister --network ic id icp_app_store > canister_ids.json
```

### Build for Production

```bash
# Android APK
cd android && ./gradlew assembleRelease

# iOS Archive
# Use Xcode to archive the project
```

## 📋 Requirements Met

✅ **GitHub Repository**: Public repository with proper structure  
✅ **dfx.json**: Located in root directory for ICP identification  
✅ **README.md**: Clear introduction and installation instructions  
✅ **canister_ids.json**: For official canister verification  

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [ICP App Documentation](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/icp-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/icp-app/discussions)

## 🔗 Links

- [Internet Computer](https://internetcomputer.org/)
- [Internet Identity](https://identity.ic0.app/)
- [DFX Documentation](https://internetcomputer.org/docs/current/developer-docs/setup/install/)
- [React Native](https://reactnative.dev/)

---

**Built with ❤️ for the Internet Computer ecosystem** 