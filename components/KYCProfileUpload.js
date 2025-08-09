import { useState } from 'react';
import kycService from '../utils/kycService';

const KYCProfileUpload = ({ onComplete, userAddress }) => {
  const [formData, setFormData] = useState({
    // Profile data
    username: '',
    fullName: '',
    age: '',
    gender: '',
    bio: '',
    interests: '',
    monthlySalary: '',
    dateOfBirth: '',
    // KYC data
    documentType: 'passport',
    documentNumber: '',
    // Files
    profileImage: null,
    idDocument: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Profile Info, 2: KYC Info, 3: File Upload

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Submitting profile for KYC verification...');
      console.log('Form data:', formData);
      console.log('User address:', userAddress);

      // Convert interests string to array
      const interestsArray = formData.interests
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0);

      // Prepare profile data for KYC submission
      const profileData = {
        userAddress: userAddress,
        username: formData.username,
        fullName: formData.fullName,
        age: parseInt(formData.age),
        gender: formData.gender,
        bio: formData.bio,
        interests: interestsArray.join(','), // Backend expects comma-separated string
        monthlySalary: parseFloat(formData.monthlySalary),
        dateOfBirth: formData.dateOfBirth,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        kycProvider: 'mock' // Use mock provider for testing
      };

      // Prepare files
      const files = {
        profileImage: formData.profileImage,
        idDocument: formData.idDocument
      };

      // Submit to KYC backend
      const result = await kycService.submitProfileForKYC(profileData, files);
      console.log('KYC submission successful:', result);

      // Show success message with transaction details
      const transactionDetails = `
🎉 Profile Successfully Created on Blockchain!

📝 Profile Transaction: ${result.data.profileTransaction || 'Mock transaction'}
✅ KYC Transaction: ${result.data.kycTransaction || 'Mock transaction'}
🆔 KYC Verification ID: ${result.data.kycVerificationId || 'Mock ID'}

Your profile is now stored on Oasis Sapphire blockchain!
You will be notified once verification is complete.
      `;
      
      alert(transactionDetails);
      onComplete({
        username: formData.username,
        isKYCVerified: false, // Will be true after backend verification
        isRegistered: true,
        transactionHash: result.data.profileTransaction,
        kycTransactionHash: result.data.kycTransaction,
        verificationId: result.data.kycVerificationId
      });

    } catch (error) {
      console.error('KYC submission failed:', error);
      alert(`KYC submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-3xl mb-4">👤</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Profile Information</h3>
        <p className="text-gray-600">Step 1 of 3: Basic profile details</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username *
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="Choose a unique username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="Enter your full legal name"
        />
        <p className="text-xs text-gray-500 mt-1">Must match your ID document</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age *
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            required
            min="18"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
            placeholder="Age"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender *
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date of Birth *
        </label>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
        />
        <p className="text-xs text-gray-500 mt-1">Must match your ID document</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bio *
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          required
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Interests *
        </label>
        <input
          type="text"
          name="interests"
          value={formData.interests}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="e.g., Travel, Music, Sports"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monthly Salary *
        </label>
        <input
          type="number"
          name="monthlySalary"
          value={formData.monthlySalary}
          onChange={handleInputChange}
          required
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="Enter monthly salary"
        />
      </div>

      <button
        type="button"
        onClick={nextStep}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
      >
        Next: KYC Information →
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-3xl mb-4">🆔</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">KYC Verification</h3>
        <p className="text-gray-600">Step 2 of 3: Identity verification details</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Type *
        </label>
        <select
          name="documentType"
          value={formData.documentType}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
        >
          <option value="passport">Passport</option>
          <option value="driver_license">Driver's License</option>
          <option value="national_id">National ID Card</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Number *
        </label>
        <input
          type="text"
          name="documentNumber"
          value={formData.documentNumber}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="Enter document number"
        />
        <p className="text-xs text-gray-500 mt-1">This information is encrypted and stored securely</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-blue-500 mr-3 mt-0.5">🔒</div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">Privacy & Security</h4>
            <p className="text-sm text-blue-700">
              Your KYC information is encrypted and stored on Oasis Sapphire, a privacy-focused blockchain. 
              Only authorized parties can access your private data after your explicit consent.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        >
          Next: Upload Files →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-3xl mb-4">📄</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Documents</h3>
        <p className="text-gray-600">Step 3 of 3: Upload your files for verification</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profile Image *
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'profileImage')}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
        />
        <p className="text-xs text-gray-500 mt-1">Clear photo of yourself (JPG, PNG, WebP)</p>
        {formData.profileImage && (
          <p className="text-xs text-green-600 mt-1">✓ {formData.profileImage.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ID Document *
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileChange(e, 'idDocument')}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
        />
        <p className="text-xs text-gray-500 mt-1">
          Clear photo or scan of your {formData.documentType.replace('_', ' ')} (JPG, PNG, PDF)
        </p>
        {formData.idDocument && (
          <p className="text-xs text-green-600 mt-1">✓ {formData.idDocument.name}</p>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-yellow-500 mr-3 mt-0.5">⚠️</div>
          <div>
            <h4 className="text-sm font-medium text-yellow-800 mb-1">Important</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Ensure your ID document is clearly visible and readable</li>
              <li>• Your name on the ID must match the full name entered above</li>
              <li>• Files are uploaded securely and encrypted</li>
              <li>• KYC verification typically takes 1-3 business days</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.profileImage || !formData.idDocument}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        >
          {isSubmitting ? 'Submitting for KYC...' : 'Submit for KYC Verification'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      {/* Progress indicator */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${
                currentStep >= step 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Connected: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
        </p>
      </div>
    </div>
  );
};

export default KYCProfileUpload; 