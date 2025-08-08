// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DatingApp {
    struct User {
        string name;
        uint256 age;
        string bio;
        string[] interests;
        uint256 monthlySalary;
        bool isVerified;
        bool isActive;
        uint256 createdAt;
    }
    
    struct Match {
        address user1;
        address user2;
        uint256 matchTime;
        bool isActive;
        bool user1Flagged;
        bool user2Flagged;
        string user1Flag;
        string user2Flag;
        bool bothApproved;
    }
    
    struct Flag {
        address from;
        address to;
        bool isRedFlag; // true = red flag (bad), false = green flag (good)
        string review;
        uint256 timestamp;
        bool isVisible;
    }
    
    mapping(address => User) public users;
    mapping(address => address[]) public userMatches;
    mapping(bytes32 => Match) public matches;
    mapping(address => Flag[]) public userFlags;
    mapping(address => bool) public isRegistered;
    
    address public owner;
    uint256 public totalUsers;
    uint256 public totalMatches;
    
    event UserRegistered(address indexed user, string name);
    event UserVerified(address indexed user);
    event MatchCreated(address indexed user1, address indexed user2, bytes32 matchId);
    event FlagSubmitted(address indexed from, address indexed to, bool isRedFlag, string review);
    event FlagApproved(address indexed user);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }
    
    modifier onlyVerified() {
        require(users[msg.sender].isVerified, "User not verified");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerUser(string memory _name, uint256 _age, string memory _bio, string[] memory _interests, uint256 _monthlySalary) public {
        require(!isRegistered[msg.sender], "User already registered");
        require(_age >= 18, "Must be 18 or older");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_bio).length <= 500, "Bio too long");
        require(_interests.length <= 10, "Too many interests");
        require(_monthlySalary > 0, "Monthly salary must be greater than 0");
        
        users[msg.sender] = User({
            name: _name,
            age: _age,
            bio: _bio,
            interests: _interests,
            monthlySalary: _monthlySalary,
            isVerified: false,
            isActive: true,
            createdAt: block.timestamp
        });
        
        isRegistered[msg.sender] = true;
        totalUsers++;
        
        emit UserRegistered(msg.sender, _name);
    }
    
    function verifyUser(address _user) public onlyOwner {
        require(isRegistered[_user], "User not registered");
        users[_user].isVerified = true;
        emit UserVerified(_user);
    }
    
    function updateProfile(string memory _bio, string[] memory _interests) public onlyRegistered {
        require(bytes(_bio).length <= 500, "Bio too long");
        require(_interests.length <= 10, "Too many interests");
        
        users[msg.sender].bio = _bio;
        users[msg.sender].interests = _interests;
    }
    
    function createMatch(address _user1, address _user2) public onlyOwner {
        require(isRegistered[_user1] && isRegistered[_user2], "Users not registered");
        require(users[_user1].isVerified && users[_user2].isVerified, "Users not verified");
        require(_user1 != _user2, "Cannot match with yourself");
        
        bytes32 matchId = keccak256(abi.encodePacked(_user1, _user2, block.timestamp));
        
        matches[matchId] = Match({
            user1: _user1,
            user2: _user2,
            matchTime: block.timestamp,
            isActive: true,
            user1Flagged: false,
            user2Flagged: false,
            user1Flag: "",
            user2Flag: "",
            bothApproved: false
        });
        
        userMatches[_user1].push(_user2);
        userMatches[_user2].push(_user1);
        totalMatches++;
        
        emit MatchCreated(_user1, _user2, matchId);
    }
    
    function submitFlag(address _to, bool _isRedFlag, string memory _review) public onlyVerified {
        require(isRegistered[_to], "Target user not registered");
        require(msg.sender != _to, "Cannot flag yourself");
        require(bytes(_review).length <= 100, "Review too long");
        require(bytes(_review).length > 0, "Review cannot be empty");
        
        // Check if users have matched
        bool haveMatched = false;
        for (uint i = 0; i < userMatches[msg.sender].length; i++) {
            if (userMatches[msg.sender][i] == _to) {
                haveMatched = true;
                break;
            }
        }
        require(haveMatched, "Can only flag users you have matched with");
        
        Flag memory newFlag = Flag({
            from: msg.sender,
            to: _to,
            isRedFlag: _isRedFlag,
            review: _review,
            timestamp: block.timestamp,
            isVisible: false
        });
        
        userFlags[_to].push(newFlag);
        
        emit FlagSubmitted(msg.sender, _to, _isRedFlag, _review);
    }
    
    function approveFlag(address _from) public onlyVerified {
        // Find and approve the flag
        for (uint i = 0; i < userFlags[msg.sender].length; i++) {
            if (userFlags[msg.sender][i].from == _from && !userFlags[msg.sender][i].isVisible) {
                userFlags[msg.sender][i].isVisible = true;
                emit FlagApproved(msg.sender);
                break;
            }
        }
    }
    
    function getUserProfile(address _user) public view returns (User memory) {
        return users[_user];
    }
    
    function getUserMatches(address _user) public view returns (address[] memory) {
        return userMatches[_user];
    }
    
    function getUserFlags(address _user) public view returns (Flag[] memory) {
        return userFlags[_user];
    }
    
    function getVisibleFlags(address _user) public view returns (Flag[] memory) {
        uint256 visibleCount = 0;
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible) {
                visibleCount++;
            }
        }
        
        Flag[] memory visibleFlags = new Flag[](visibleCount);
        uint256 index = 0;
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible) {
                visibleFlags[index] = userFlags[_user][i];
                index++;
            }
        }
        
        return visibleFlags;
    }
    
    function deactivateUser() public onlyRegistered {
        users[msg.sender].isActive = false;
    }
    
    function reactivateUser() public onlyRegistered {
        users[msg.sender].isActive = true;
    }
} 