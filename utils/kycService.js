import { ethers } from 'ethers';

const KYC_CONTRACT_ABI = [
  'function getPublicProfile(address _user) external view returns (string username, uint256 age, string gender, bool isKYCVerified, bool isActive, uint256 createdAt)',
  'function getPrivateProfile(address _user) external view returns (string fullName, string bio, string[] interests, uint256 monthlySalary, string profileImageHash)',
  'function getKYCData(address _user) external view returns (string documentType, string verificationProvider, uint256 verificationTimestamp, bool isVerified)',
  'function authorizeViewer(address _viewer) external',
  'function revokeViewer(address _viewer) external',
  'function isAuthorizedViewer(address _user, address _viewer) external view returns (bool)',
  'function updateProfile(string _bio, string[] _interests, string _profileImageHash) external',
  'function isRegistered(address _user) external view returns (bool)',
  'function isUserActiveAndVerified(address _user) external view returns (bool)',
  'function getUsers(uint256 _start, uint256 _limit) external view returns (address[] addresses, string[] usernames, bool[] kycStatuses, bool[] activeStatuses)',
  'function getVerifiedActiveUsers(uint256 _start, uint256 _limit) external view returns (address[] addresses, string[] usernames)',
  'event ProfileCreated(address indexed user, string username, uint256 timestamp)',
  'event KYCVerified(address indexed user, address indexed verifier, uint256 timestamp)',
  'event ProfileUpdated(address indexed user, uint256 timestamp)',
  'event ViewerAuthorized(address indexed user, address indexed viewer, uint256 timestamp)',
  'event ViewerRevoked(address indexed user, address indexed viewer, uint256 timestamp)'
];

class KYCService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
    this.backendUrl = process.env.NEXT_PUBLIC_KYC_BACKEND_URL || 'http://localhost:3001';
  }

  // Connect to MetaMask wallet
  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask extension.');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your MetaMask wallet.');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      const address = await this.signer.getAddress();
      console.log('Connected to wallet:', address);

      return address;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  // Set contract address and initialize contract
  setContractAddress(address) {
    this.contractAddress = address;
    if (this.signer) {
      this.contract = new ethers.Contract(address, KYC_CONTRACT_ABI, this.signer);
      console.log('KYC contract initialized at:', address);
    } else {
      throw new Error('Wallet not connected. Please connect wallet first.');
    }
  }

  // Submit profile and ID documents to backend for KYC verification
  async submitProfileForKYC(profileData, files) {
    try {
      console.log('Submitting profile for KYC verification...');

      const formData = new FormData();
      
      // Add profile data
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== undefined) {
          formData.append(key, profileData[key]);
        }
      });

      // Add files
      if (files.profileImage) {
        formData.append('profileImage', files.profileImage);
      }
      if (files.idDocument) {
        formData.append('idDocument', files.idDocument);
      }

      const response = await fetch(`${this.backendUrl}/api/submit-profile`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit profile for KYC');
      }

      console.log('🎉 Profile submitted successfully to blockchain!');
      console.log('📝 Transaction Details:', {
        profileTx: result.data?.profileTransaction || 'Mock transaction',
        kycTx: result.data?.kycTransaction || 'Mock transaction',
        verificationId: result.data?.kycVerificationId || 'Mock ID',
        backendUrl: this.backendUrl
      });
      
      return result;
    } catch (error) {
      console.error('Failed to submit profile for KYC:', error);
      throw error;
    }
  }

  // Check user verification status
  async getUserStatus(address) {
    try {
      const response = await fetch(`${this.backendUrl}/api/user/${address}/status`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get user status');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to get user status:', error);
      throw error;
    }
  }

  // Get public profile (accessible by anyone)
  async getPublicProfile(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('🔍 Reading profile from blockchain for address:', address);
      const profile = await this.contract.getPublicProfile(address);
      
      const profileData = {
        username: profile[0],
        age: Number(profile[1]),
        gender: profile[2],
        isKYCVerified: profile[3],
        isActive: profile[4],
        createdAt: Number(profile[5]),
        blockchainAddress: address
      };

      console.log('✅ Profile retrieved from blockchain:', {
        username: profileData.username,
        isKYCVerified: profileData.isKYCVerified,
        createdAt: new Date(profileData.createdAt * 1000).toLocaleString(),
        contractAddress: this.contractAddress
      });
      
      return profileData;
    } catch (error) {
      console.error('Failed to get public profile:', error);
      throw error;
    }
  }

  // Get private profile (only authorized viewers)
  async getPrivateProfile(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const profile = await this.contract.getPrivateProfile(address);
      
      return {
        fullName: profile[0],
        bio: profile[1],
        interests: profile[2],
        monthlySalary: Number(profile[3]) / 100, // Convert back from cents
        profileImageHash: profile[4]
      };
    } catch (error) {
      console.error('Failed to get private profile:', error);
      throw error;
    }
  }

  // Get KYC data (only authorized viewers)
  async getKYCData(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const kycData = await this.contract.getKYCData(address);
      
      return {
        documentType: kycData[0],
        verificationProvider: kycData[1],
        verificationTimestamp: Number(kycData[2]),
        isVerified: kycData[3]
      };
    } catch (error) {
      console.error('Failed to get KYC data:', error);
      throw error;
    }
  }

  // Authorize someone to view private profile
  async authorizeViewer(viewerAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.authorizeViewer(viewerAddress);
      const receipt = await tx.wait();
      
      console.log('Viewer authorized:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('Failed to authorize viewer:', error);
      throw error;
    }
  }

  // Revoke viewer authorization
  async revokeViewer(viewerAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.revokeViewer(viewerAddress);
      const receipt = await tx.wait();
      
      console.log('Viewer authorization revoked:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('Failed to revoke viewer authorization:', error);
      throw error;
    }
  }

  // Check if viewer is authorized
  async isAuthorizedViewer(userAddress, viewerAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.isAuthorizedViewer(userAddress, viewerAddress);
    } catch (error) {
      console.error('Failed to check viewer authorization:', error);
      return false;
    }
  }

  // Update profile (limited fields)
  async updateProfile(bio, interests, profileImageHash) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.updateProfile(bio, interests, profileImageHash || '');
      const receipt = await tx.wait();
      
      console.log('Profile updated:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  // Check if user is registered
  async isRegistered(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.isRegistered(address);
    } catch (error) {
      console.error('Failed to check registration:', error);
      return false;
    }
  }

  // Check if user is active and verified
  async isUserActiveAndVerified(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.isUserActiveAndVerified(address);
    } catch (error) {
      console.error('Failed to check user status:', error);
      return false;
    }
  }

  // Get users for discovery (public data only)
  async getUsers(start = 0, limit = 10) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getUsers(start, limit);
      
      const users = [];
      for (let i = 0; i < result.addresses.length; i++) {
        users.push({
          address: result.addresses[i],
          username: result.usernames[i],
          isKYCVerified: result.kycStatuses[i],
          isActive: result.activeStatuses[i]
        });
      }
      
      return users;
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  // Get verified active users only
  async getVerifiedActiveUsers(start = 0, limit = 10) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getVerifiedActiveUsers(start, limit);
      
      const users = [];
      for (let i = 0; i < result.addresses.length; i++) {
        users.push({
          address: result.addresses[i],
          username: result.usernames[i],
          isKYCVerified: true,
          isActive: true
        });
      }
      
      return users;
    } catch (error) {
      console.error('Failed to get verified active users:', error);
      return [];
    }
  }

  // Get full profiles for discovery (combines public and private data where authorized)
  async getDiscoveryProfiles(start = 0, limit = 10, currentUserAddress) {
    try {
      // Get basic user list
      const users = await this.getVerifiedActiveUsers(start, limit);
      
      // Get detailed profiles
      const profiles = [];
      for (const user of users) {
        try {
          // Always get public profile
          const publicProfile = await this.getPublicProfile(user.address);
          
          let privateProfile = null;
          // Try to get private profile if authorized
          if (currentUserAddress) {
            try {
              const isAuthorized = await this.isAuthorizedViewer(user.address, currentUserAddress);
              if (isAuthorized || user.address === currentUserAddress) {
                privateProfile = await this.getPrivateProfile(user.address);
              }
            } catch (error) {
              // Not authorized or other error - that's fine
              console.log(`No access to private profile for ${user.address}`);
            }
          }
          
          profiles.push({
            address: user.address,
            ...publicProfile,
            privateData: privateProfile
          });
        } catch (error) {
          console.error(`Failed to get profile for ${user.address}:`, error);
        }
      }
      
      return profiles;
    } catch (error) {
      console.error('Failed to get discovery profiles:', error);
      return [];
    }
  }

  // Switch to Oasis Sapphire Testnet
  async switchToSapphireTestnet() {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const sapphireTestnet = {
      chainId: '0x5AFF', // 23295 in hex
      chainName: 'Oasis Sapphire Testnet',
      nativeCurrency: {
        name: 'ROSE',
        symbol: 'ROSE',
        decimals: 18,
      },
      rpcUrls: ['https://testnet.sapphire.oasis.dev'],
      blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.dev'],
    };

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sapphireTestnet.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [sapphireTestnet],
          });
        } catch (addError) {
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }

  // Utility function to format addresses
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Utility function to format timestamps
  formatTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString();
  }
}

// Create and export singleton instance
const kycService = new KYCService();
export default kycService; 