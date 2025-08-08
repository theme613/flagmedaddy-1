import { createContext, useContext, useReducer } from 'react';
import oasisService from '../utils/oasis';

const AppContext = createContext();

const initialState = {
  isConnected: false,
  userAddress: null,
  userProfile: null,
  isProfileComplete: false,
  loading: false,
  error: null
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CONNECT_WALLET':
      return { 
        ...state, 
        isConnected: true, 
        userAddress: action.payload,
        loading: false,
        error: null
      };
    
    case 'DISCONNECT_WALLET':
      return { 
        ...state, 
        isConnected: false, 
        userAddress: null,
        userProfile: null,
        isProfileComplete: false,
        loading: false,
        error: null
      };
    
    case 'SET_USER_PROFILE':
      return { 
        ...state, 
        userProfile: action.payload,
        isProfileComplete: true
      };
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const connectWallet = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null }); // Clear any previous errors
      
      // Connect to MetaMask
      const address = await oasisService.connectWallet();
      dispatch({ type: 'CONNECT_WALLET', payload: address });
      
      // Set contract address for Oasis Sapphire
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x93e1fa4fe8b563bab2a5dc7fd1b134c138984b1d';
      console.log('Setting contract address:', contractAddress);
      
      try {
        await oasisService.setContractAddress(contractAddress);
        console.log('Contract address set successfully');
      } catch (error) {
        console.error('Failed to set contract address:', error);
        throw new Error(`Failed to initialize contract: ${error.message}`);
      }
      
      // Check if user is already registered on the blockchain
      const isRegistered = await oasisService.isRegistered(address);
      if (isRegistered) {
        const profile = await oasisService.getUserProfile(address);
        dispatch({ type: 'SET_USER_PROFILE', payload: profile });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };



  const disconnectWallet = async () => {
    try {
      await oasisService.disconnect();
      dispatch({ type: 'DISCONNECT_WALLET' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const createProfile = (profileData) => {
    dispatch({ type: 'SET_USER_PROFILE', payload: profileData });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };



  const value = {
    ...state,
    connectWallet,
    disconnectWallet,
    createProfile,
    clearError
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 