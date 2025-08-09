require('dotenv').config();
const { ethers } = require('ethers');
const crypto = require('crypto');
const multer = require('multer');
const express = require('express');
const cors = require('cors');

// Mock KYC verification providers (replace with real services like Jumio, Onfido, etc.)
class KYCVerificationService {
    constructor() {
        this.providers = {
            'jumio': this.verifyWithJumio.bind(this),
            'onfido': this.verifyWithOnfido.bind(this),
            'mock': this.mockVerification.bind(this)
        };
    }

    // Mock verification for testing
    async mockVerification(documentData, personalData) {
        console.log('Mock KYC verification started...');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock validation logic
        const isValid = documentData.documentType && 
                        documentData.documentNumber && 
                        personalData.fullName && 
                        personalData.dateOfBirth;
        
        return {
            success: isValid,
            confidence: isValid ? 0.95 : 0.1,
            provider: 'mock',
            documentType: documentData.documentType,
            verificationId: `mock_${Date.now()}`,
            timestamp: new Date().toISOString(),
            details: isValid ? 'Document verified successfully' : 'Invalid document data'
        };
    }

    // Jumio integration (placeholder)
    async verifyWithJumio(documentData, personalData) {
        // Integrate with Jumio API
        console.log('Jumio KYC verification...');
        return {
            success: true,
            confidence: 0.98,
            provider: 'jumio',
            documentType: documentData.documentType,
            verificationId: `jumio_${Date.now()}`,
            timestamp: new Date().toISOString()
        };
    }

    // Onfido integration (placeholder)
    async verifyWithOnfido(documentData, personalData) {
        // Integrate with Onfido API
        console.log('Onfido KYC verification...');
        return {
            success: true,
            confidence: 0.97,
            provider: 'onfido',
            documentType: documentData.documentType,
            verificationId: `onfido_${Date.now()}`,
            timestamp: new Date().toISOString()
        };
    }

    async verify(provider, documentData, personalData) {
        if (!this.providers[provider]) {
            throw new Error(`KYC provider ${provider} not supported`);
        }

        return await this.providers[provider](documentData, personalData);
    }
}

// Blockchain service for interacting with KYCProfile contract
class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = process.env.KYC_CONTRACT_ADDRESS;
        this.privateKey = process.env.BACKEND_PRIVATE_KEY;
    }

      async initialize() {
    // Check if contract address and private key are available
    if (!this.contractAddress || this.contractAddress === '0x0000000000000000000000000000000000000000') {
      console.log('🎭 MOCK MODE ENABLED - Contract address not set');
      console.log('   To use REAL blockchain transactions:');
      console.log('   1. Deploy contract: npx hardhat run scripts/deploy-kyc.js --network sapphireTestnet');
      console.log('   2. Update KYC_CONTRACT_ADDRESS in backend/.env');
      console.log('   3. Restart this service');
      this.mockMode = true;
      return;
    }

    if (!this.privateKey || this.privateKey === 'your_private_key_here' || this.privateKey === 'temp_key_for_testing') {
      console.log('🎭 MOCK MODE ENABLED - Private key not set');
      console.log('   To use REAL blockchain transactions:');
      console.log('   1. Add your private key to backend/.env: BACKEND_PRIVATE_KEY=0xyour_key_here');
      console.log('   2. Restart this service');
      this.mockMode = true;
      return;
    }

    try {
      // Connect to Oasis Sapphire Testnet
      this.provider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');
      this.signer = new ethers.Wallet(this.privateKey, this.provider);

      // Contract ABI (simplified for backend use)
      const contractABI = [
        'function createProfile(address _user, string _username, uint256 _age, string _gender, string _fullName, string _bio, string[] _interests, uint256 _monthlySalary, string _profileImageHash) external',
        'function verifyKYC(address _user, string _documentType, string _encryptedDocumentNumber, string _kycDocumentHash, string _verificationProvider) external',
        'function getPublicProfile(address _user) external view returns (string username, uint256 age, string gender, bool isKYCVerified, bool isActive, uint256 createdAt)',
        'function getPrivateProfile(address _user) external view returns (string fullName, string bio, string[] interests, uint256 monthlySalary, string profileImageHash)',
        'function isRegistered(address _user) external view returns (bool)',
        'function authorizedVerifiers(address) external view returns (bool)',
        'function rateUser(address _userToRate, bool _isGreenFlag) external',
        'function getMyFlags() external view returns (uint256 greenFlags, uint256 redFlags)',
        'function getMyGreenFlaggers(uint256 _start, uint256 _limit) external view returns (address[] flaggers, string[] usernames, uint256[] timestamps)',
        'function checkMutualMatch(address _user1, address _user2) external view returns (bool)',
        'function getVerifiedActiveUsers(uint256 _start, uint256 _limit) external view returns (address[] addresses, string[] usernames)'
      ];

      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.signer);
      console.log('🚀 REAL BLOCKCHAIN MODE ENABLED!');
      console.log('   Contract Address:', this.contractAddress);
      console.log('   Network: Oasis Sapphire Testnet');
      console.log('   All transactions will be REAL blockchain transactions!');
      this.mockMode = false;
    } catch (error) {
      console.log('⚠️  Failed to initialize blockchain service - running in MOCK MODE:', error.message);
      this.mockMode = true;
    }
  }

      async createProfile(userAddress, profileData) {
    if (this.mockMode) {
      console.log('📝 MOCK: Creating profile for:', userAddress);
      return {
        hash: `mock_tx_${Date.now()}`,
        blockNumber: Math.floor(Math.random() * 1000000),
        status: 1
      };
    }

    try {
      console.log('Creating profile on blockchain for:', userAddress);
      
      const tx = await this.contract.createProfile(
        userAddress,
        profileData.username,
        profileData.age,
        profileData.gender,
        profileData.fullName,
        profileData.bio,
        profileData.interests,
        Math.floor(profileData.monthlySalary * 100), // Convert to cents
        profileData.profileImageHash
      );

      const receipt = await tx.wait();
      console.log('Profile created successfully:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  }

      async verifyKYC(userAddress, kycData) {
    if (this.mockMode) {
      console.log('✅ MOCK: Verifying KYC for:', userAddress);
      return {
        hash: `mock_kyc_tx_${Date.now()}`,
        blockNumber: Math.floor(Math.random() * 1000000),
        status: 1
      };
    }

    try {
      console.log('Verifying KYC on blockchain for:', userAddress);
      
      // Encrypt document number
      const encryptedDocNumber = this.encryptData(kycData.documentNumber);
      
      const tx = await this.contract.verifyKYC(
        userAddress,
        kycData.documentType,
        encryptedDocNumber,
        kycData.documentHash,
        kycData.provider
      );

      const receipt = await tx.wait();
      console.log('KYC verified successfully:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('Failed to verify KYC:', error);
      throw error;
    }
  }

    encryptData(data) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.ENCRYPTION_PASSWORD || 'default-password', 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return `${iv.toString('hex')}:${encrypted}`;
    }
}

// Express server setup
const app = express();
app.use(cors());
app.use(express.json());

// File upload configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed'), false);
        }
    }
});

// Initialize services
const kycService = new KYCVerificationService();
const blockchainService = new BlockchainService();

// Mock IPFS service (replace with real IPFS)
class IPFSService {
    static async uploadFile(file) {
        // Mock IPFS upload
        const hash = `Qm${crypto.randomBytes(22).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}`;
        console.log(`Mock IPFS upload: ${file.originalname} -> ${hash}`);
        return hash;
    }
}

// API Routes

// Submit profile and ID for verification
app.post('/api/submit-profile', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            userAddress,
            username,
            fullName,
            age,
            gender,
            bio,
            interests,
            monthlySalary,
            documentType,
            documentNumber,
            dateOfBirth,
            kycProvider = 'mock'
        } = req.body;

        // Validate required fields
        if (!userAddress || !username || !fullName || !documentType || !documentNumber) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Upload files to IPFS
        let profileImageHash = '';
        let idDocumentHash = '';

        if (req.files.profileImage) {
            profileImageHash = await IPFSService.uploadFile(req.files.profileImage[0]);
        }

        if (req.files.idDocument) {
            idDocumentHash = await IPFSService.uploadFile(req.files.idDocument[0]);
        }

        // Prepare data for KYC verification
        const documentData = {
            documentType,
            documentNumber,
            documentHash: idDocumentHash
        };

        const personalData = {
            fullName,
            dateOfBirth,
            age: parseInt(age)
        };

        // Perform KYC verification
        console.log('Starting KYC verification...');
        const kycResult = await kycService.verify(kycProvider, documentData, personalData);

        if (!kycResult.success) {
            return res.status(400).json({
                success: false,
                message: 'KYC verification failed',
                details: kycResult.details
            });
        }

        // Create profile on blockchain
        const profileData = {
            username,
            fullName,
            age: parseInt(age),
            gender,
            bio: bio || '',
            interests: interests ? interests.split(',').map(i => i.trim()) : [],
            monthlySalary: parseFloat(monthlySalary) || 0,
            profileImageHash
        };

        const profileReceipt = await blockchainService.createProfile(userAddress, profileData);

        // Verify KYC on blockchain
        const kycData = {
            documentType: kycResult.documentType,
            documentNumber: documentNumber,
            documentHash: idDocumentHash,
            provider: kycResult.provider
        };

        const kycReceipt = await blockchainService.verifyKYC(userAddress, kycData);

        res.json({
            success: true,
            message: 'Profile created and KYC verified successfully',
            data: {
                profileTransaction: profileReceipt.hash,
                kycTransaction: kycReceipt.hash,
                kycVerificationId: kycResult.verificationId,
                profileImageHash,
                idDocumentHash
            }
        });

    } catch (error) {
        console.error('Profile submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get user verification status
app.get('/api/user/:address/status', async (req, res) => {
  try {
    const { address } = req.params;

    if (blockchainService.mockMode) {
      // Mock response for testing
      return res.json({
        success: true,
        data: {
          isRegistered: false,
          isKYCVerified: false,
          mockMode: true
        }
      });
    }

    // Check if user is registered
    const isRegistered = await blockchainService.contract.isRegistered(address);
    
    if (!isRegistered) {
      return res.json({
        success: true,
        data: {
          isRegistered: false,
          isKYCVerified: false
        }
      });
    }

    // Get public profile
    const normalizedAddress = ethers.getAddress(address);
    const publicProfile = await blockchainService.contract.getPublicProfile(normalizedAddress);
    
    res.json({
      success: true,
      data: {
        isRegistered: true,
        isKYCVerified: publicProfile.isKYCVerified,
        username: publicProfile.username,
        age: Number(publicProfile.age),
        gender: publicProfile.gender,
        isActive: publicProfile.isActive,
        createdAt: Number(publicProfile.createdAt),
        walletAddress: normalizedAddress
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user status',
      error: error.message
    });
  }
});

// Rating system endpoints

// Rate a user (green flag = like, red flag = dislike)
app.post('/api/rate-user', async (req, res) => {
  try {
    const { raterAddress, userToRate, isGreenFlag } = req.body;

    if (!raterAddress || !userToRate || typeof isGreenFlag !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: raterAddress, userToRate, isGreenFlag'
      });
    }

    if (blockchainService.mockMode) {
      return res.json({
        success: true,
        message: 'Mock mode: Rating would be stored',
        data: { raterAddress, userToRate, isGreenFlag, mockMode: true }
      });
    }

    // Normalize addresses
    const normalizedRater = ethers.getAddress(raterAddress);
    const normalizedRated = ethers.getAddress(userToRate);

    // Call smart contract function
    const tx = await blockchainService.contract.rateUser(normalizedRated, isGreenFlag);
    const receipt = await tx.wait();

    res.json({
      success: true,
      message: `${isGreenFlag ? 'Green flag' : 'Red flag'} submitted successfully`,
      data: {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        raterAddress: normalizedRater,
        userToRate: normalizedRated,
        isGreenFlag
      }
    });

  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: error.message
    });
  }
});

// Get user's received flags (only they can see this)
app.get('/api/user/:address/my-flags', async (req, res) => {
  try {
    const { address } = req.params;

    if (blockchainService.mockMode) {
      return res.json({
        success: true,
        data: { greenFlags: 0, redFlags: 0, mockMode: true }
      });
    }

    const normalizedAddress = ethers.getAddress(address);
    
    // This would need to be called by the user themselves due to the onlyRegistered modifier
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      data: {
        greenFlags: 0,
        redFlags: 0,
        note: 'This endpoint requires direct contract interaction from the user'
      }
    });

  } catch (error) {
    console.error('Get flags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user flags',
      error: error.message
    });
  }
});

// Get users for swiping (active verified users)
app.get('/api/users-for-swiping', async (req, res) => {
  try {
    const { start = 0, limit = 10 } = req.query;

    if (blockchainService.mockMode) {
      return res.json({
        success: true,
        data: {
          users: [],
          mockMode: true,
          message: 'Mock mode: No users available'
        }
      });
    }

    // Get verified active users from the contract
    const result = await blockchainService.contract.getVerifiedActiveUsers(
      parseInt(start), 
      parseInt(limit)
    );

    const users = [];
    for (let i = 0; i < result.addresses.length; i++) {
      // Get additional profile data for each user
      try {
        const publicProfile = await blockchainService.contract.getPublicProfile(result.addresses[i]);
        users.push({
          address: result.addresses[i],
          username: result.usernames[i],
          age: Number(publicProfile.age),
          gender: publicProfile.gender,
          isKYCVerified: publicProfile.isKYCVerified,
          isActive: publicProfile.isActive,
          createdAt: Number(publicProfile.createdAt)
        });
      } catch (profileError) {
        console.error('Error getting profile for', result.addresses[i], profileError);
        // Skip this user if we can't get their profile
      }
    }

    res.json({
      success: true,
      data: {
        users,
        total: users.length,
        start: parseInt(start),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users for swiping',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'KYC service is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
    }

    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        await blockchainService.initialize();
        
        app.listen(PORT, () => {
            console.log(`KYC service running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = {
    app,
    KYCVerificationService,
    BlockchainService,
    IPFSService
}; 