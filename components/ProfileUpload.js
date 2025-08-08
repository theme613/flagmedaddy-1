import { useState } from 'react';
import oasisService from '../utils/oasis';

const ProfileUpload = ({ onComplete, userAddress }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    interests: '',
    monthlySalary: '',
    payslip: null,
    profileImage: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
    }
  };

  const handlePayslipChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        payslip: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Starting profile registration...');
      console.log('Form data:', formData);
      console.log('User address:', userAddress);

      // Convert interests string to array
      const interestsArray = formData.interests
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0);

      console.log('Interests array:', interestsArray);
      console.log('Monthly salary (cents):', parseFloat(formData.monthlySalary) * 100);

      // Register user on the smart contract
      const receipt = await oasisService.registerUser(
        formData.name,
        parseInt(formData.age),
        formData.bio,
        interestsArray,
        parseFloat(formData.monthlySalary) * 100 // Convert to cents to avoid decimal issues
      );

      console.log('Profile registered on blockchain:', receipt);

      // Get the user profile from the contract
      const profile = await oasisService.getUserProfile(userAddress);

      // Call the completion callback with profile data from blockchain
      onComplete({
        name: profile.name,
        age: profile.age,
        bio: profile.bio,
        interests: profile.interests,
        monthlySalary: profile.monthlySalary,
        isVerified: profile.isVerified,
        isActive: profile.isActive,
        createdAt: profile.createdAt,
        address: userAddress,
        payslip: formData.payslip,
        profileImage: formData.profileImage // Keep local file references
      });
    } catch (error) {
      console.error('Profile registration failed:', error);
      alert(`Profile registration failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <div className="text-3xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Your Profile</h3>
        <p className="text-gray-600">Register your profile on Oasis Sapphire blockchain</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Enter your name"
          />
        </div>

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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Enter your age"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interests
          </label>
          <input
            type="text"
            name="interests"
            value={formData.interests}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Enter your monthly salary"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your monthly salary in your local currency
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payslip *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handlePayslipChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload your latest payslip (PDF, JPG, or PNG)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload a profile picture (optional)
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          {isSubmitting ? 'Registering on Blockchain...' : 'Register on Blockchain'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Connected wallet: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
        </p>
      </div>
    </div>
  );
};

export default ProfileUpload; 