import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import oasisService from '../utils/oasis';

const Flags = () => {
  const { userAddress, flags, loadUserData } = useApp();
  const [flagDetails, setFlagDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFlagDetails();
  }, [flags]);

  const loadFlagDetails = async () => {
    if (!flags.length) return;

    setLoading(true);
    try {
      const details = await Promise.all(
        flags.map(async (flag) => {
          try {
            const fromProfile = await oasisService.getUserProfile(flag.from);
            return {
              ...flag,
              fromProfile
            };
          } catch (error) {
            console.error(`Failed to load profile for ${flag.from}:`, error);
            return {
              ...flag,
              fromProfile: null
            };
          }
        })
      );
      
      setFlagDetails(details.filter(d => d.fromProfile !== null));
    } catch (error) {
      console.error('Failed to load flag details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFlagIcon = (isRedFlag) => {
    return isRedFlag ? (
      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Flags</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading flags...</p>
        </div>
      </div>
    );
  }

  if (flagDetails.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Flags</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600">No flags received yet.</p>
          <p className="text-gray-500 text-sm mt-2">Flags from your matches will appear here once approved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Flags</h2>
      
      <div className="space-y-4">
        {flagDetails.map((flag, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${
              flag.isRedFlag 
                ? 'border-red-200 bg-red-50' 
                : 'border-green-200 bg-green-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getFlagIcon(flag.isRedFlag)}
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {flag.fromProfile.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(flag.timestamp)}
                  </p>
                </div>
              </div>
              
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                flag.isRedFlag
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {flag.isRedFlag ? 'Red Flag' : 'Green Flag'}
              </span>
            </div>
            
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-gray-700">{flag.review}</p>
            </div>
            
            <div className="mt-3 text-xs text-gray-500">
              <p>From: {flag.from}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">About Flags</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Green flags indicate positive experiences</li>
          <li>• Red flags indicate concerning behavior</li>
          <li>• Flags are only visible after both users approve</li>
          <li>• All flags are reviewed by the community</li>
        </ul>
      </div>
    </div>
  );
};

export default Flags; 