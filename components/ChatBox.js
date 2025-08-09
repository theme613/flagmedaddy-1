import { useState, useEffect, useRef } from 'react';
import FlagSubmission from './FlagSubmission';

const ChatBox = ({ isOpen, onClose, chatPartner, userAddress }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPartnerFlags, setShowPartnerFlags] = useState(false);
  const [showFlagSubmission, setShowFlagSubmission] = useState(false);
  const messagesEndRef = useRef(null);

  // Mock flag data for chat partner (what others said about them)
  const partnerFlags = {
    redFlags: [
      { id: 1, comment: "Always on phone during dates", reviewer: "Anonymous", date: "2 weeks ago" },
      { id: 2, comment: "Talks only about themselves", reviewer: "Anonymous", date: "1 month ago" },
    ],
    greenFlags: [
      { id: 3, comment: "Great listener and very kind", reviewer: "Anonymous", date: "3 weeks ago" },
      { id: 4, comment: "Pays for coffee, true gentleman", reviewer: "Anonymous", date: "2 weeks ago" },
      { id: 5, comment: "Amazing sense of humor!", reviewer: "Anonymous", date: "1 week ago" },
    ]
  };

  // Mock conversation data
  const mockMessages = [
    {
      id: 1,
      sender: chatPartner?.address || '0x1234...5678',
      senderName: chatPartner?.name || 'Emma',
      content: "Hey! Thanks for accepting my vibe! 💕",
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      isOwn: false
    },
    {
      id: 2,
      sender: userAddress,
      senderName: 'You',
      content: "Hi! I loved your message, you seem really interesting! 😊",
      timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
      isOwn: true
    },
    {
      id: 3,
      sender: chatPartner?.address || '0x1234...5678',
      senderName: chatPartner?.name || 'Emma',
      content: "That's so sweet! I'd love to get to know you better. What's your favorite way to spend weekends?",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      isOwn: false
    }
  ];

  useEffect(() => {
    if (isOpen && chatPartner) {
      // Load conversation history
      setMessages(mockMessages);
    }
  }, [isOpen, chatPartner]);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: userAddress,
      senderName: 'You',
      content: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate partner typing and response
    setTimeout(() => {
      setIsTyping(true);
    }, 1000);

    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "That's awesome! Tell me more 😄",
        "I totally agree! 💯",
        "Haha, you're funny! 😂",
        "That sounds amazing! I'd love to try that too 🌟",
        "You have such great taste! 👌",
        "I'm really enjoying our conversation! 💕"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const partnerMessage = {
        id: messages.length + 2,
        sender: chatPartner?.address || '0x1234...5678',
        senderName: chatPartner?.name || 'Emma',
        content: randomResponse,
        timestamp: new Date(),
        isOwn: false
      };

      setMessages(prev => [...prev, partnerMessage]);
    }, 3000);
  };

  const handleFlagSubmission = (flagData) => {
    console.log('Flag submitted:', flagData);
    // In real app, this would send to blockchain/backend
    // For now, just log it
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[600px] flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold">
              {chatPartner?.avatar || 'E'}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{chatPartner?.name || 'Emma Rodriguez'}</h3>
                {/* Flag Summary Badges */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setShowPartnerFlags(!showPartnerFlags)}
                    className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 rounded-full px-2 py-1 text-xs transition-colors"
                  >
                    <span className="text-red-300">🚩</span>
                    <span>{partnerFlags.redFlags.length}</span>
                  </button>
                  <button
                    onClick={() => setShowPartnerFlags(!showPartnerFlags)}
                    className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 rounded-full px-2 py-1 text-xs transition-colors"
                  >
                    <span className="text-green-300">💚</span>
                    <span>{partnerFlags.greenFlags.length}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-pink-100">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              📹
            </button>
            <button className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              📞
            </button>
            <button
              onClick={() => setShowFlagSubmission(true)}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors text-sm"
              title="Rate this person after your date"
            >
              🚩
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl font-bold p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Flag Details Panel */}
        {showPartnerFlags && (
          <div className="bg-white border-b border-gray-200 p-4 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                <span>🚩</span>
                <span>What others said about {chatPartner?.name || 'them'}</span>
              </h4>
              <button
                onClick={() => setShowPartnerFlags(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Red Flags */}
              {partnerFlags.redFlags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-600 mb-2 flex items-center space-x-1">
                    <span>🚩</span>
                    <span>Red Flags ({partnerFlags.redFlags.length})</span>
                  </h5>
                  <div className="space-y-2">
                    {partnerFlags.redFlags.map((flag) => (
                      <div key={flag.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800 italic">"{flag.comment}"</p>
                        <p className="text-xs text-red-600 mt-1">{flag.reviewer} • {flag.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Green Flags */}
              {partnerFlags.greenFlags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-green-600 mb-2 flex items-center space-x-1">
                    <span>💚</span>
                    <span>Green Flags ({partnerFlags.greenFlags.length})</span>
                  </h5>
                  <div className="space-y-2">
                    {partnerFlags.greenFlags.map((flag) => (
                      <div key={flag.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 italic">"{flag.comment}"</p>
                        <p className="text-xs text-green-600 mt-1">{flag.reviewer} • {flag.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 These are anonymous reviews from their previous dates. Use this info to guide your conversation!
              </p>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {/* Welcome Message */}
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm border inline-block">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-sm text-gray-600">
                You and <span className="font-semibold text-pink-600">{chatPartner?.name || 'Emma'}</span> matched!
              </p>
              <p className="text-xs text-gray-500 mt-1">Start your conversation below</p>
            </div>
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.isOwn
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm border'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.isOwn ? 'text-pink-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-2xl max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{chatPartner?.name || 'Emma'} is typing...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black"
                maxLength={500}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                😊
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-2 rounded-full transition-all duration-200 font-medium"
            >
              Send
            </button>
          </form>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex space-x-3 text-gray-400">
              <button className="hover:text-gray-600 transition-colors">📎</button>
              <button className="hover:text-gray-600 transition-colors">📷</button>
              <button className="hover:text-gray-600 transition-colors">🎤</button>
            </div>
            <p className="text-xs text-gray-500">
              {newMessage.length}/500
            </p>
          </div>
        </div>
      </div>

      {/* Flag Submission Modal */}
      <FlagSubmission
        isOpen={showFlagSubmission}
        onClose={() => setShowFlagSubmission(false)}
        datePartner={chatPartner}
        onSubmit={handleFlagSubmission}
      />
    </div>
  );
};

export default ChatBox; 