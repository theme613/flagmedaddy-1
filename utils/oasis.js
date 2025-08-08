import { BrowserProvider, Contract } from 'ethers';

// Oasis Sapphire testnet configuration
const SAPPHIRE_TESTNET_RPC = 'https://testnet.sapphire.oasis.dev';
const SAPPHIRE_TESTNET_CHAIN_ID = 0x5aff; // 23295 in decimal

// Contract ABI (simplified for the main functions we'll use)
const CONTRACT_ABI = [
  'function registerUser(string name, uint256 age, string bio, string[] interests, uint256 monthlySalary)',
  'function getUserProfile(address user) view returns (string name, uint256 age, string bio, string[] interests, uint256 monthlySalary, bool isVerified, bool isActive, uint256 createdAt)',
  'function getUserMatches(address user) view returns (address[])',
  'function submitFlag(address to, bool isRedFlag, string review)',
  'function approveFlag(address from)',
  'function getVisibleFlags(address user) view returns (tuple(address from, address to, bool isRedFlag, string review, uint256 timestamp, bool isVisible)[])',
  'function isRegistered(address user) view returns (bool)',
  'function updateProfile(string bio, string[] interests)',
  'event UserRegistered(address indexed user, string name)',
  'event FlagSubmitted(address indexed from, address indexed to, bool isRedFlag, string review)',
  'event FlagApproved(address indexed user)'
];

class OasisService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
  }

  async initialize() {
    try {
      // Don't auto-detect to avoid extension conflicts
      // Let users manually trigger connection
      return false;
    } catch (error) {
      console.error('Failed to initialize wallet service:', error);
      return false;
    }
  }

  detectWallet() {
    if (typeof window === 'undefined') return false;
    
    // Don't try to detect wallets automatically to avoid extension conflicts
    // Let users manually trigger connection instead
    return false;
  }

  async connectWallet() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection is only available in browser environment');
      }

      // Completely isolate wallet connection to avoid extension conflicts
      return new Promise((resolve, reject) => {
        // Use setTimeout to defer execution and avoid immediate extension conflicts
        setTimeout(async () => {
          try {
            // Check for ethereum object
            if (!window.ethereum) {
              reject(new Error('MetaMask not found. Please install MetaMask extension.'));
              return;
            }

            // Check if it's MetaMask
            if (!window.ethereum.isMetaMask) {
              reject(new Error('Please use MetaMask wallet. Other wallets are not supported.'));
              return;
            }

            // Request accounts with timeout
            const accountsPromise = window.ethereum.request({
              method: 'eth_requestAccounts'
            });

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Connection timeout')), 10000);
            });

            const accounts = await Promise.race([accountsPromise, timeoutPromise]);

            if (!accounts || accounts.length === 0) {
              reject(new Error('No accounts found. Please unlock MetaMask.'));
              return;
            }

            const address = accounts[0];
            console.log('Connected to MetaMask:', address);

            // Create provider and signer
            this.provider = new BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();

            resolve(address);
          } catch (error) {
            console.error('Wallet connection error:', error);
            
            // Handle specific error types
            if (error.code === 4001) {
              reject(new Error('Connection was rejected. Please approve the connection in MetaMask.'));
            } else if (error.message.includes('Extension ID') || 
                       error.message.includes('runtime.sendMessage') ||
                       error.message.includes('chrome.runtime') ||
                       error.message.includes('chrome-extension://')) {
              reject(new Error('Browser extension conflict detected. Please try refreshing the page or temporarily disable other wallet extensions.'));
            } else if (error.message.includes('timeout')) {
              reject(new Error('Connection timeout. Please try again.'));
            } else {
              reject(new Error(`Connection failed: ${error.message}`));
            }
          }
        }, 100); // Small delay to avoid immediate conflicts
      });
    } catch (error) {
      throw error;
    }
  }

  async switchToSapphireTestnet() {
    try {
      // Use the provider we found earlier
      const walletProvider = this.provider?.provider || window.ethereum;
      
      if (!walletProvider) {
        console.warn('No wallet provider available for network switching');
        return;
      }
      
      await walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SAPPHIRE_TESTNET_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        const walletProvider = this.provider?.provider || window.ethereum;
        
        if (!walletProvider) {
          console.warn('No wallet provider available for network addition');
          return;
        }
        
        await walletProvider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${SAPPHIRE_TESTNET_CHAIN_ID.toString(16)}`,
            chainName: 'Oasis Sapphire Testnet',
            nativeCurrency: {
              name: 'ROSE',
              symbol: 'ROSE',
              decimals: 18,
            },
            rpcUrls: [SAPPHIRE_TESTNET_RPC],
            blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.dev'],
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  async setContractAddress(address) {
    console.log('Setting contract address:', address);
    console.log('Signer available:', !!this.signer);
    
    if (!this.signer) {
      throw new Error('Signer not available. Please connect wallet first.');
    }
    
    this.contractAddress = address;
    this.contract = new Contract(address, CONTRACT_ABI, this.signer);
    console.log('Contract initialized:', !!this.contract);
    
    // Test if contract is deployed at this address
    try {
      const totalUsers = await this.contract.totalUsers();
      console.log('Contract test successful, total users:', totalUsers.toString());
    } catch (error) {
      console.error('Contract test failed:', error);
      throw new Error(`Contract not deployed at address ${address} or ABI mismatch`);
    }
  }

  async registerUser(name, age, bio, interests, monthlySalary) {
    console.log('registerUser called with:', { name, age, bio, interests, monthlySalary });
    console.log('Contract available:', !!this.contract);
    console.log('Contract address:', this.contractAddress);
    
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.registerUser(name, age, bio, interests, monthlySalary);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to register user:', error);
      throw error;
    }
  }

  async getUserProfile(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const profile = await this.contract.getUserProfile(address);
      return {
        name: profile[0],
        age: profile[1].toNumber(),
        bio: profile[2],
        interests: profile[3],
        monthlySalary: profile[4].toNumber(),
        isVerified: profile[5],
        isActive: profile[6],
        createdAt: profile[7].toNumber()
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  async getUserMatches(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const matches = await this.contract.getUserMatches(address);
      return matches;
    } catch (error) {
      console.error('Failed to get user matches:', error);
      throw error;
    }
  }

  async submitFlag(to, isRedFlag, review) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.submitFlag(to, isRedFlag, review);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to submit flag:', error);
      throw error;
    }
  }

  async approveFlag(from) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.approveFlag(from);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to approve flag:', error);
      throw error;
    }
  }

  async getVisibleFlags(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const flags = await this.contract.getVisibleFlags(address);
      return flags.map(flag => ({
        from: flag[0],
        to: flag[1],
        isRedFlag: flag[2],
        review: flag[3],
        timestamp: flag[4].toNumber(),
        isVisible: flag[5]
      }));
    } catch (error) {
      console.error('Failed to get visible flags:', error);
      throw error;
    }
  }

  async isRegistered(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.isRegistered(address);
    } catch (error) {
      console.error('Failed to check registration:', error);
      throw error;
    }
  }

  async updateProfile(bio, interests) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.updateProfile(bio, interests);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  async getCurrentAddress() {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return await this.signer.getAddress();
  }

  async disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
  }

  // Manual detection method for debugging
  debugWalletDetection() {
    console.log('=== Rose Wallet Detection Debug ===');
    console.log('Window.rose:', window.rose);
    console.log('Window.ethereum:', window.ethereum);
    console.log('Ethereum.isRoseWallet:', window.ethereum?.isRoseWallet);
    console.log('Ethereum.isOasisWallet:', window.ethereum?.isOasisWallet);
    console.log('Ethereum.providers:', window.ethereum?.providers);
    
    if (window.ethereum?.providers) {
      window.ethereum.providers.forEach((provider, index) => {
        console.log(`Provider ${index}:`, {
          isRoseWallet: provider.isRoseWallet,
          isOasisWallet: provider.isOasisWallet,
          isMetaMask: provider.isMetaMask,
          name: provider.name || 'Unknown'
        });
      });
    }
    
    console.log('Detection result:', this.detectRoseWallet());
    console.log('=== End Debug ===');
  }
}

// Create a singleton instance
const oasisService = new OasisService();

export default oasisService; 