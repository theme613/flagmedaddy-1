# 💘 FlagMeDaddy - Dating App on Oasis Sapphire

A decentralized dating application built on Oasis Sapphire blockchain with Rose Wallet integration, featuring user verification, matching, and a unique flagging system for post-date reviews.

## 🌟 Features

- **Metamask Wallet Integration**: Secure login using Metamask Wallet
- **User Verification**: Smart contract-based profile verification system
- **Matching System**: Connect with other verified users
- **Flag System**: Submit red flags (bad) or green flags (good) after dates
- **Review System**: Reviews with approval mechanism
- **Privacy**: Review won't be visible to the person
- **Community Review**: All flags are reviewed by the community

## 🏗️ Architecture

### Smart Contract (`contracts/DatingApp.sol`)
- User registration and profile management
- Verification system
- Matching functionality
- Flag submission and approval system
- Privacy controls for flag visibility

### Frontend Components
- **WalletConnect**: Metamask Wallet integration
- **UserRegistration**: Profile creation
- **Navigation**: App navigation and user status
- **Matches**: View and interact with matches
- **Flags**: Button to send anonymous flags and reviews
- **Inbox**: To receive invitations from the others
- **Chats**: Chatting system
  

### Key Features
- **User Profiles**: Name, age, bio, interests
- **Verification**: Admin-controlled user verification
- **Matching**: Smart contract-based matching system
- **Flagging**: Post-date feedback system
- **Privacy**: Flags (review) are hidden from the person who get reviewed

## 📱 Usage

### 1. Connect Wallet
- Click "Connect Metamask Wallet"
- Approve the connection in your Metamask Wallet
- Switch to Sapphire testnet if prompted

### 2. Create Profile
- Fill in your name, age, bio, and interests
- Identity verification details
- Submit your profile and id for verification
- Wait for admin verification

### 3. Get Matched
- Once verified, you'll be matched with other users
- View match profiles and details

### 4. Submit Flags
- After going on a date, can submit a flag
- Choose red flag (bad) or green flag (good)
- Write a review

### 5. View Flags
- Check others received flags in the Flags tab
- Flags won't be visible to the person that get flagged

## 🔒 Security Features

- **Smart Contract Verification**: All user data stored on blockchain
- **Privacy Controls**: Flags won't be visible to the person that get flagged 
- **Age Verification**: Minimum age requirement (18+)
- **Content Limits**: Bio, interests, reviews(flagged)
- **Admin Controls**: User verification system

## 🌐 Network Configuration

### Oasis Sapphire Testnet
- **RPC URL**: `https://testnet.sapphire.oasis.dev`
- **Chain ID**: `23295` (0x5aff)
- **Currency**: ROSE
- **Explorer**: `https://explorer.oasis.io/testnet/sapphire`

### Mainnet (Production)
- **RPC URL**: `https://sapphire.oasis.dev`
- **Chain ID**: `23294` (0x5afe)
- **Currency**: ROSE
- **Explorer**: `https://explorer.oasis.io/mainnet/sapphire`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the code comments and this README
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Community**: Join the [Oasis Discord](https://discord.com/invite/oasis-network-community-748635004384313474) for blockchain support

## ⚠️ Disclaimer

This is a demo application for educational purposes. Use at your own risk. The smart contract has not been audited for production use.

## 🔮 Future Enhancements

- [ ] Advanced matching algorithms
- [ ] Mobile app
- [ ] Premium features
- [ ] Community governance
- [ ] Event organization
