import { useState } from 'react';
import { AppProvider, useApp } from '../contexts/AppContext';
import ErrorBoundary from '../components/ErrorBoundary';
import IsolatedWalletConnect from '../components/IsolatedWalletConnect';
import ProfileUpload from '../components/ProfileUpload';

const WalletApp = () => {
  const { isConnected, userAddress, userProfile, isProfileComplete, connectWallet, disconnectWallet, createProfile, loading, error } = useApp();

  // If not connected, show wallet connection screen
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🦊 MetaMask Connect</h1>
            <p className="text-lg text-gray-600">Simple MetaMask wallet connection</p>
            <p className="text-sm text-gray-500 mt-2">Connect your MetaMask wallet to get started</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <IsolatedWalletConnect 
              onConnect={connectWallet}
              onError={(errorMessage) => {
                console.error('Wallet connection error:', errorMessage);
              }}
            />
          </div>
          
          {error && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Connection Failed</span>
                </div>
                <p className="mt-1 text-sm">{error}</p>
                <p className="mt-2 text-sm">
                  💡 Try refreshing the page or check your MetaMask extension
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If connected but no profile, show profile upload
  if (!isProfileComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 Profile Setup</h1>
            <p className="text-lg text-gray-600">Create your profile to continue</p>
            <p className="text-sm text-gray-500 mt-2">Connected: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</p>
          </div>
          
          <ProfileUpload 
            onComplete={createProfile}
            userAddress={userAddress}
          />
        </div>
      </div>
    );
  }

  // Profile complete - show dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎉 Welcome!</h1>
          <p className="text-lg text-gray-600">Your profile is complete</p>
        </div>
        
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Profile Created</h3>
          
          <div className="text-left mb-6">
            <p className="text-gray-600 mb-2"><strong>Name:</strong> {userProfile?.name}</p>
            <p className="text-gray-600 mb-2"><strong>Age:</strong> {userProfile?.age}</p>
            {userProfile?.bio && <p className="text-gray-600 mb-2"><strong>Bio:</strong> {userProfile.bio}</p>}
            {userProfile?.interests && userProfile.interests.length > 0 && (
              <p className="text-gray-600 mb-2">
                <strong>Interests:</strong> {userProfile.interests.join(', ')}
              </p>
            )}
            {userProfile?.monthlySalary && (
              <p className="text-gray-600 mb-2">
                <strong>Monthly Salary:</strong> ${(userProfile.monthlySalary / 100).toFixed(2)}
              </p>
            )}
            <p className="text-gray-600 mb-2"><strong>Wallet:</strong> {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</p>
            <p className="text-gray-600 mb-2">
              <strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${userProfile?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {userProfile?.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
              </span>
            </p>
            <p className="text-gray-600 mb-2">
              <strong>Registered:</strong> {new Date(userProfile?.createdAt * 1000).toLocaleDateString()}
            </p>
          </div>
          
          <button
            onClick={disconnectWallet}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <WalletApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
