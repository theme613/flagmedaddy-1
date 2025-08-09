// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract KYCProfile {
    // Public profile data (visible to everyone)
    struct PublicProfile {
        string username;
        uint256 age;
        string gender;
        bool isKYCVerified;
        bool isActive;
        uint256 createdAt;
    }

    // Private profile data (only accessible by owner or authorized parties)
    struct PrivateProfile {
        string fullName;
        string bio;
        string[] interests;
        uint256 monthlySalary;
        string profileImageHash;
        string kycDocumentHash;
        string encryptedPersonalData; // Additional sensitive data
    }

    // KYC verification data (confidential)
    struct KYCData {
        string documentType; // "passport", "driver_license", etc.
        string documentNumber; // Encrypted
        string verificationProvider;
        uint256 verificationTimestamp;
        bool isVerified;
    }

    // Rating/Flag data (confidential - users can't see flags they gave)
    struct UserRating {
        bool hasRated;
        bool isGreenFlag; // true = green flag (like), false = red flag (dislike)
        uint256 timestamp;
    }

    // Mappings
    mapping(address => PublicProfile) public publicProfiles;
    mapping(address => PrivateProfile) private privateProfiles;
    mapping(address => KYCData) private kycData;
    mapping(address => bool) public isRegistered;
    mapping(address => mapping(address => bool)) private authorizedViewers;
    
    // Rating system mappings (confidential)
    mapping(address => mapping(address => UserRating)) private userRatings; // rater => rated => rating
    mapping(address => uint256) private greenFlagCount; // count of green flags received
    mapping(address => uint256) private redFlagCount; // count of red flags received

    // Array to store all registered users for discovery
    address[] public registeredUsers;

    // Authorized KYC verifiers
    mapping(address => bool) public authorizedVerifiers;
    address public owner;

    // Events
    event ProfileCreated(address indexed user, string username, uint256 timestamp);
    event KYCVerified(address indexed user, address indexed verifier, uint256 timestamp);
    event ProfileUpdated(address indexed user, uint256 timestamp);
    event ViewerAuthorized(address indexed user, address indexed viewer, uint256 timestamp);
    event ViewerRevoked(address indexed user, address indexed viewer, uint256 timestamp);
    event UserRated(address indexed rater, address indexed rated, bool isGreenFlag, uint256 timestamp);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }

    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner, "Not authorized to verify KYC");
        _;
    }

    modifier onlyAuthorizedToView(address _user) {
        require(
            msg.sender == _user || 
            authorizedViewers[_user][msg.sender] || 
            msg.sender == owner,
            "Not authorized to view private data"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedVerifiers[msg.sender] = true; // Owner is default verifier
    }

    // Create user profile (called by backend after initial verification)
    function createProfile(
        address _user,
        string memory _username,
        uint256 _age,
        string memory _gender,
        string memory _fullName,
        string memory _bio,
        string[] memory _interests,
        uint256 _monthlySalary,
        string memory _profileImageHash
    ) external onlyAuthorizedVerifier {
        require(!isRegistered[_user], "User already registered");
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(_age >= 18 && _age <= 100, "Age must be between 18 and 100");
        require(bytes(_fullName).length > 0, "Full name cannot be empty");

        // Store public profile
        publicProfiles[_user] = PublicProfile({
            username: _username,
            age: _age,
            gender: _gender,
            isKYCVerified: false, // Will be set true after KYC verification
            isActive: true,
            createdAt: block.timestamp
        });

        // Store private profile (encrypted on Sapphire)
        privateProfiles[_user] = PrivateProfile({
            fullName: _fullName,
            bio: _bio,
            interests: _interests,
            monthlySalary: _monthlySalary,
            profileImageHash: _profileImageHash,
            kycDocumentHash: "",
            encryptedPersonalData: ""
        });

        isRegistered[_user] = true;
        registeredUsers.push(_user);

        emit ProfileCreated(_user, _username, block.timestamp);
    }

    // Verify KYC (called by backend after off-chain verification)
    function verifyKYC(
        address _user,
        string memory _documentType,
        string memory _encryptedDocumentNumber,
        string memory _kycDocumentHash,
        string memory _verificationProvider
    ) external onlyAuthorizedVerifier {
        require(isRegistered[_user], "User not registered");

        // Store KYC data (confidential)
        kycData[_user] = KYCData({
            documentType: _documentType,
            documentNumber: _encryptedDocumentNumber,
            verificationProvider: _verificationProvider,
            verificationTimestamp: block.timestamp,
            isVerified: true
        });

        // Update public profile verification status
        publicProfiles[_user].isKYCVerified = true;

        // Update private profile with KYC document hash
        privateProfiles[_user].kycDocumentHash = _kycDocumentHash;

        emit KYCVerified(_user, msg.sender, block.timestamp);
    }

    // Get public profile (accessible by anyone)
    function getPublicProfile(address _user) external view returns (
        string memory username,
        uint256 age,
        string memory gender,
        bool isKYCVerified,
        bool isActive,
        uint256 createdAt
    ) {
        require(isRegistered[_user], "User not registered");
        PublicProfile memory profile = publicProfiles[_user];
        
        return (
            profile.username,
            profile.age,
            profile.gender,
            profile.isKYCVerified,
            profile.isActive,
            profile.createdAt
        );
    }

    // Get private profile (only authorized viewers)
    function getPrivateProfile(address _user) external view onlyAuthorizedToView(_user) returns (
        string memory fullName,
        string memory bio,
        string[] memory interests,
        uint256 monthlySalary,
        string memory profileImageHash
    ) {
        require(isRegistered[_user], "User not registered");
        PrivateProfile memory profile = privateProfiles[_user];
        
        return (
            profile.fullName,
            profile.bio,
            profile.interests,
            profile.monthlySalary,
            profile.profileImageHash
        );
    }

    // Get KYC data (only user or authorized parties)
    function getKYCData(address _user) external view onlyAuthorizedToView(_user) returns (
        string memory documentType,
        string memory verificationProvider,
        uint256 verificationTimestamp,
        bool isVerified
    ) {
        require(isRegistered[_user], "User not registered");
        KYCData memory kyc = kycData[_user];
        
        // Don't return encrypted document number for security
        return (
            kyc.documentType,
            kyc.verificationProvider,
            kyc.verificationTimestamp,
            kyc.isVerified
        );
    }

    // User authorizes someone to view their private data
    function authorizeViewer(address _viewer) external onlyRegistered {
        require(_viewer != address(0), "Invalid viewer address");
        require(_viewer != msg.sender, "Cannot authorize yourself");
        
        authorizedViewers[msg.sender][_viewer] = true;
        emit ViewerAuthorized(msg.sender, _viewer, block.timestamp);
    }

    // User revokes viewer authorization
    function revokeViewer(address _viewer) external onlyRegistered {
        authorizedViewers[msg.sender][_viewer] = false;
        emit ViewerRevoked(msg.sender, _viewer, block.timestamp);
    }

    // Check if viewer is authorized
    function isAuthorizedViewer(address _user, address _viewer) external view returns (bool) {
        return authorizedViewers[_user][_viewer];
    }

    // Update profile (user can update certain fields)
    function updateProfile(
        string memory _bio,
        string[] memory _interests,
        string memory _profileImageHash
    ) external onlyRegistered {
        require(bytes(_bio).length > 0, "Bio cannot be empty");
        
        privateProfiles[msg.sender].bio = _bio;
        privateProfiles[msg.sender].interests = _interests;
        if (bytes(_profileImageHash).length > 0) {
            privateProfiles[msg.sender].profileImageHash = _profileImageHash;
        }

        emit ProfileUpdated(msg.sender, block.timestamp);
    }

    // Deactivate profile
    function deactivateProfile() external onlyRegistered {
        publicProfiles[msg.sender].isActive = false;
    }

    // Reactivate profile
    function reactivateProfile() external onlyRegistered {
        publicProfiles[msg.sender].isActive = true;
    }

    // Get total number of registered users
    function getTotalUsers() external view returns (uint256) {
        return registeredUsers.length;
    }

    // Get registered users for discovery (only public data)
    function getUsers(uint256 _start, uint256 _limit) external view returns (
        address[] memory addresses,
        string[] memory usernames,
        bool[] memory kycStatuses,
        bool[] memory activeStatuses
    ) {
        require(_start < registeredUsers.length, "Start index out of bounds");
        
        uint256 end = _start + _limit;
        if (end > registeredUsers.length) {
            end = registeredUsers.length;
        }
        
        uint256 length = end - _start;
        addresses = new address[](length);
        usernames = new string[](length);
        kycStatuses = new bool[](length);
        activeStatuses = new bool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            address userAddr = registeredUsers[_start + i];
            addresses[i] = userAddr;
            usernames[i] = publicProfiles[userAddr].username;
            kycStatuses[i] = publicProfiles[userAddr].isKYCVerified;
            activeStatuses[i] = publicProfiles[userAddr].isActive;
        }
        
        return (addresses, usernames, kycStatuses, activeStatuses);
    }

    // Get active KYC-verified users only
    function getVerifiedActiveUsers(uint256 _start, uint256 _limit) external view returns (
        address[] memory addresses,
        string[] memory usernames
    ) {
        require(_start < registeredUsers.length, "Start index out of bounds");
        
        // Count verified active users
        uint256 verifiedCount = 0;
        uint256 collected = 0;
        
        // First pass: count how many we can return
        for (uint256 i = _start; i < registeredUsers.length && collected < _limit; i++) {
            address userAddr = registeredUsers[i];
            if (publicProfiles[userAddr].isKYCVerified && publicProfiles[userAddr].isActive) {
                verifiedCount++;
                collected++;
            }
        }
        
        // Second pass: collect the data
        addresses = new address[](verifiedCount);
        usernames = new string[](verifiedCount);
        
        uint256 resultIndex = 0;
        collected = 0;
        
        for (uint256 i = _start; i < registeredUsers.length && collected < _limit; i++) {
            address userAddr = registeredUsers[i];
            if (publicProfiles[userAddr].isKYCVerified && publicProfiles[userAddr].isActive) {
                addresses[resultIndex] = userAddr;
                usernames[resultIndex] = publicProfiles[userAddr].username;
                resultIndex++;
                collected++;
            }
        }
        
        return (addresses, usernames);
    }

    // Admin functions
    function addAuthorizedVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = true;
    }

    function removeAuthorizedVerifier(address _verifier) external onlyOwner {
        require(_verifier != owner, "Cannot remove owner as verifier");
        authorizedVerifiers[_verifier] = false;
    }

    // Emergency functions
    function emergencyDeactivateUser(address _user) external onlyOwner {
        require(isRegistered[_user], "User not registered");
        publicProfiles[_user].isActive = false;
    }

    // Generate encrypted data using Sapphire's confidential features
    function encryptSensitiveData(string memory _data) internal view returns (string memory) {
        // Use Sapphire's encryption capabilities for confidential data
        // This is automatically handled by Sapphire's confidential state
        // For now, we'll return the data as-is since Sapphire handles encryption at the runtime level
        return _data;
    }

    // Check if user exists and is active
    function isUserActiveAndVerified(address _user) external view returns (bool) {
        return isRegistered[_user] && 
               publicProfiles[_user].isActive && 
               publicProfiles[_user].isKYCVerified;
    }

    // Rating system functions
    
    // Rate another user (green flag = like, red flag = dislike)
    function rateUser(address _userToRate, bool _isGreenFlag) external onlyRegistered {
        require(_userToRate != address(0), "Invalid user address");
        require(_userToRate != msg.sender, "Cannot rate yourself");
        require(isRegistered[_userToRate], "User to rate is not registered");
        require(publicProfiles[_userToRate].isActive, "User to rate is not active");

        // Check if user has already rated this person
        UserRating storage existingRating = userRatings[msg.sender][_userToRate];
        
        if (existingRating.hasRated) {
            // Update existing rating
            if (existingRating.isGreenFlag != _isGreenFlag) {
                // Rating changed, update counters
                if (existingRating.isGreenFlag) {
                    // Was green flag, now changing to red flag
                    greenFlagCount[_userToRate]--;
                    redFlagCount[_userToRate]++;
                } else {
                    // Was red flag, now changing to green flag
                    redFlagCount[_userToRate]--;
                    greenFlagCount[_userToRate]++;
                }
                existingRating.isGreenFlag = _isGreenFlag;
            }
            existingRating.timestamp = block.timestamp;
        } else {
            // New rating
            userRatings[msg.sender][_userToRate] = UserRating({
                hasRated: true,
                isGreenFlag: _isGreenFlag,
                timestamp: block.timestamp
            });
            
            // Update counters
            if (_isGreenFlag) {
                greenFlagCount[_userToRate]++;
            } else {
                redFlagCount[_userToRate]++;
            }
        }

        emit UserRated(msg.sender, _userToRate, _isGreenFlag, block.timestamp);
    }

    // Get flags received by a user (only the user themselves can see this)
    function getMyFlags() external view onlyRegistered returns (
        uint256 greenFlags,
        uint256 redFlags
    ) {
        return (greenFlagCount[msg.sender], redFlagCount[msg.sender]);
    }

    // Get users who gave you green flags (matches) - only you can see this
    function getMyGreenFlaggers(uint256 _start, uint256 _limit) external view onlyRegistered returns (
        address[] memory flaggers,
        string[] memory usernames,
        uint256[] memory timestamps
    ) {
        // Count green flaggers first
        uint256 greenFlaggers = 0;
        for (uint256 i = 0; i < registeredUsers.length; i++) {
            address flagger = registeredUsers[i];
            if (userRatings[flagger][msg.sender].hasRated && 
                userRatings[flagger][msg.sender].isGreenFlag) {
                greenFlaggers++;
            }
        }

        // Apply pagination
        uint256 startIndex = 0;
        uint256 collected = 0;
        uint256 resultSize = 0;
        
        // Calculate result size with pagination
        for (uint256 i = 0; i < registeredUsers.length && collected < _start + _limit; i++) {
            address flagger = registeredUsers[i];
            if (userRatings[flagger][msg.sender].hasRated && 
                userRatings[flagger][msg.sender].isGreenFlag) {
                if (collected >= _start) {
                    resultSize++;
                }
                collected++;
            }
        }

        // Collect the results
        flaggers = new address[](resultSize);
        usernames = new string[](resultSize);
        timestamps = new uint256[](resultSize);
        
        uint256 resultIndex = 0;
        collected = 0;
        
        for (uint256 i = 0; i < registeredUsers.length && resultIndex < resultSize; i++) {
            address flagger = registeredUsers[i];
            if (userRatings[flagger][msg.sender].hasRated && 
                userRatings[flagger][msg.sender].isGreenFlag) {
                if (collected >= _start) {
                    flaggers[resultIndex] = flagger;
                    usernames[resultIndex] = publicProfiles[flagger].username;
                    timestamps[resultIndex] = userRatings[flagger][msg.sender].timestamp;
                    resultIndex++;
                }
                collected++;
            }
        }

        return (flaggers, usernames, timestamps);
    }

    // Check if two users have mutual green flags (match)
    function checkMutualMatch(address _user1, address _user2) external view returns (bool) {
        require(msg.sender == _user1 || msg.sender == _user2, "Can only check matches for yourself");
        
        return userRatings[_user1][_user2].hasRated && 
               userRatings[_user1][_user2].isGreenFlag &&
               userRatings[_user2][_user1].hasRated && 
               userRatings[_user2][_user1].isGreenFlag;
    }
} 