import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMessageSquare, 
  FiX, 
  FiSend, 
  FiPaperclip, 
  FiSmile,
  FiChevronLeft,
  FiSearch,
  FiMoreVertical,
  FiUser
} from 'react-icons/fi';
import { IoCheckmarkDone } from 'react-icons/io5';
import { BsThreeDotsVertical, BsEmojiSmile, BsMicFill } from 'react-icons/bs';
import { RiSendPlaneFill } from 'react-icons/ri';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import Cookies from 'js-cookie';

const ChatComponent = ({ 
  isEquipmentChat = false, 
  product = null, 
  onClose = null,
  showBackButton = false,
  onBack = null
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoom, setChatRoom] = useState(null);
  const [ws, setWs] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [file, setFile] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [receivers, setReceivers] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fakeUsers = {
    "user123": {
      user_id: "user123",
      first_name: "Ahmed",
      last_name: "Ben Ali",
      username: "ahmed123",
      profile_picture: "assets/man1.jpg"
    },
    "2": {
      user_id: "2",
      first_name: "Ahmed",
      last_name: "Ben Ali",
      username: "ahmed123",
      profile_picture: "assets/man2.jpg"
    },
    "user456": {
      user_id: "user456",
      first_name: "Sara",
      last_name: "Trabelsi",
      username: "sara456",
      profile_picture: "assets/woman.jpg"
    },
    "user789": {
      user_id: "user789",
      first_name: "Mounir",
      last_name: "Gharbi",
      username: "mounir789",
      profile_picture: "assets/man3.jpg"
    }
  };

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchProfilereceiver = async (receiver_id) => {
    try {
      if (!receiver_id) {
        throw new Error("User ID is missing");
      }

      console.log("receiver_id", receiver_id);

      const user = fakeUsers[receiver_id];

      if (!user) {
        throw new Error("User not found in fake table");
      }

      return user;
    } catch (err) {
      console.error("Error fetching profile from fake data:", err);
      return null;
    }
  };

  const fetchUserDetails = async (userId) => {
    const fallbackProfile = {
      username: `User ${userId?.slice(0, 5) || "Unknown"}`,
      first_name: `User ${userId?.slice(0, 5) || "Unknown"}`,
      last_name: '',
      profile_picture: null,
      user_id: userId || "unknown"
    };

    try {
      if (!userId) {
        console.warn("fetchUserDetails: Missing userId");
        return fallbackProfile;
      }

      const profile = await fetchProfilereceiver(userId);
      const profileData = Array.isArray(profile) ? profile[0] : profile;

      if (!profileData || typeof profileData !== 'object') {
        console.warn("fetchUserDetails: Invalid profile data received:", profileData);
        return fallbackProfile;
      }

      console.log("✅ Fetched profileData:", profileData);

      return {
        username: profileData.username || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
        first_name: profileData.first_name || fallbackProfile.first_name,
        last_name: profileData.last_name || '',
        profile_picture: profileData.profile_picture || null,
        user_id: profileData.user_id || userId
      };
    } catch (err) {
      console.error("❌ Error fetching user details:", err);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    if (isEquipmentChat) return;

    const fetchChatRoomsAndReceivers = async () => {
      try {
        const response = await axios.get(
          `https://chat-service-phmb.onrender.com/api/chat/chat/user/1/`,
          { withCredentials: true }
        );
        
        setChatRooms(response.data.chatrooms);
        
        const receiversData = await Promise.all(
          response.data.chatrooms.map(async (room) => {
            const otherUserId = room.members.find((id) => id !== "1");
            if (otherUserId) {
              return await fetchUserDetails(otherUserId);
            }
            return null;
          })
        );
        
        setReceivers(receiversData.filter(Boolean));
      } catch (err) {
        console.error("Error fetching chat rooms:", err);
        toast.error("Failed to load chat rooms");
      }
    };

    fetchChatRoomsAndReceivers();
  }, [isEquipmentChat]);

  useEffect(() => {
    const initializeChat = async () => {
      if (!isEquipmentChat || !product || !user) return;
      
      try {
        setIsLoadingMessages(true);

        const createResponse = await axios.post(
          "https://chat-service-phmb.onrender.com/api/chat/chat/",
          {
            sender_id: '1',
            receiver_id: getOtherUserId(),
          },
          { withCredentials: true }
        );
        setChatRoom(createResponse.data);

        const messagesResponse = await axios.get(
          `https://chat-service-phmb.onrender.com/api/chat/room/${createResponse.data.chatroom}/`,
          {
            params: { user_id: 1 },
            withCredentials: true,
          }
        );
        setMessages(messagesResponse.data.messages);

        const otherUserData = await fetchUserDetails(product.user);
        setOtherUser(otherUserData);
      } catch (err) {
        console.error("Chat initialization error:", err);
        toast.error("Failed to initialize chat");
      } finally {
        setIsLoadingMessages(false);
      }
    };

    initializeChat();
  }, [isEquipmentChat]);

  const fetchRoomMessages = async (roomId) => {
    try {
      setIsLoadingMessages(true);
      const response = await axios.get(
        `https://chat-service-phmb.onrender.com/api/chat/room/${roomId}/`,
        { 
          params: { user_id: 1 },
          withCredentials: true 
        }
      );
      setMessages(response.data.messages);
      
      const otherUserId = response.data.chatroom.members.find(id => id !== "1");
      if (otherUserId) {
        const userDetails = await fetchUserDetails(otherUserId);
        setOtherUser(userDetails);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const selectChatRoom = async (room) => {
    setSelectedRoom(room);
    await fetchRoomMessages(room.id);
  };

  useEffect(() => {
    const roomId = isEquipmentChat ? chatRoom?.chatroom : selectedRoom?.id;
    if (!roomId ) return;

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }

    const websocket = new WebSocket(`wss://chat-service-phmb.onrender.com/ws/chatroom/${roomId}/1/`);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setWs(websocket);
    };

    websocket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        
        if (data.type === "chat_message") {
          setMessages(prev => {
            const exists = prev.some(msg => 
              msg.id === data.message.id || 
              (msg.temporary && msg.temp_id === data.message.temp_id)
            );
            
            if (!exists) return [...prev, { ...data.message, temporary: false }];
            
            return prev.map(msg => 
              (msg.temporary && msg.temp_id === data.message.temp_id) ? 
              { ...data.message, temporary: false } : msg
            );
          });
        } 
        else if (data.type === "typing_status") {
          if (data.user_id !== "1") {
            setOtherUserTyping(data.typing);
          }
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    websocket.onclose = (event) => {
      if (!event.wasClean) {
        toast.error("Connection closed unexpectedly. Please refresh.");
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("Connection error. Please refresh.");
    };

    return () => {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatRoom?.chatroom, selectedRoom?.id, isEquipmentChat]);

  const handleTyping = (isTyping) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    setIsTyping(isTyping);
    ws.send(JSON.stringify({
      action: "typing",
      typing: isTyping,
      receiver_id: getOtherUserId()
    }));
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        ws.send(JSON.stringify({
          action: "typing",
          typing: false,
          receiver_id: getOtherUserId()
        }));
      }, 3000);
    }
  };

  const getOtherUserId = () => {
    if (isEquipmentChat) return product?.user;
    if (!selectedRoom) return null;
    return selectedRoom.members.find(id => id !== '1');
  };

  const getDisplayName = () => {
    if (!otherUser) return `User ${getOtherUserId()?.slice(0, 5) || 'Unknown'}`;
    return `${otherUser.first_name} ${otherUser.last_name || ''}`.trim();
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile({
        name: selectedFile.name,
        type: selectedFile.type.includes('image') ? 'image' : 'document',
        url: URL.createObjectURL(selectedFile)
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    const tempId = Date.now();
    const tempMessage = {
      temp_id: tempId,
      content: newMessage,
      sender_id: '1',
      receiver_id: getOtherUserId(),
      created_at: new Date().toISOString(),
      is_read: false,
      room: isEquipmentChat ? chatRoom?.chatroom : selectedRoom?.id,
      temporary: true,
      ...(file && { attachment: file })
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    setFile(null);
    handleTyping(false);

    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          action: "message",
          content: newMessage,
          receiver_id: getOtherUserId(),
          temp_id: tempId,
          ...(file && { attachment: file })
        }));
      } else {
        throw new Error("WebSocket connection not ready");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages(prev => prev.filter(msg => msg.temp_id !== tempId));
      toast.error("Failed to send message");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChatRooms = chatRooms.filter(room => {
    const otherUserId = room.members.find(id => id !== "1");
    const receiver = receivers.find(r => r?.user_id === otherUserId);
    const displayName = receiver ? `${receiver.first_name} ${receiver.last_name}` : `User ${otherUserId?.slice(0, 5)}`;
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left sidebar - Chat list */}
      <div className={`${selectedRoom ? 'hidden md:flex md:w-80 lg:w-96' : 'w-full'} flex flex-col border-r border-gray-200 bg-white`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-lg text-gray-800">Messages</h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {chatRooms.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filteredChatRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FiMessageSquare className="text-2xl text-gray-400" />
              </div>
              <p className="text-center mb-4">No conversations yet</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Start New Chat
              </button>
            </div>
          ) : (
            filteredChatRooms.map((room) => {
              const otherUserId = room.members.find(id => id !== '1');
              const receiver = receivers.find(r => r?.user_id === otherUserId);
              const displayName = receiver ? `${receiver.first_name} ${receiver.last_name}` : `User ${otherUserId?.slice(0, 5)}`;
              
              const lastMessageTime = room.last_message_time ? formatDistanceToNow(new Date(room.last_message_time), { addSuffix: true }) : '';
              
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => selectChatRoom(room)}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center transition-colors ${
                    selectedRoom?.id === room.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3 overflow-hidden">
                      {receiver?.profile_picture ? (
                        <img 
                          src={receiver.profile_picture} 
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiUser className="text-gray-500 text-xl" />
                      )}
                    </div>
                    {room.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {room.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900 truncate">
                        {displayName}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {lastMessageTime}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {room.last_message || 'No messages yet'}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Right side - Chat area */}
      {(selectedRoom || isEquipmentChat) ? (
        <div className={`${selectedRoom ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-white`}>
          {/* Chat header */}
          <div className="p-3 border-b border-gray-200 bg-white flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={() => setSelectedRoom(null)}
                className="md:hidden mr-2 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 overflow-hidden">
                  {otherUser?.profile_picture ? (
                    <img 
                      src={otherUser.profile_picture} 
                      alt={otherUser.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-gray-500" />
                  )}
                </div>
                {otherUserTyping && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {getDisplayName()}
                </h3>
                <p className="text-xs text-gray-500">
                  {otherUserTyping ? (
                    <span className="flex items-center">
                      <span className="animate-pulse">Typing</span>
                      <span className="ml-1 flex space-x-1">
                        <span className="inline-block w-1 h-1 bg-gray-500 rounded-full animate-bounce"></span>
                        <span className="inline-block w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="inline-block w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </span>
                    </span>
                  ) : 'Online'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                <FiSearch className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                <BsThreeDotsVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages container */}
          <div 
            className="flex-1 overflow-y-auto p-4 bg-gray-50"
          >
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FiMessageSquare className="text-3xl text-gray-400" />
                </div>
                <p className="text-center max-w-xs">
                  {isEquipmentChat 
                    ? "No messages yet. Say hello to start the conversation!" 
                    : "This is the beginning of your conversation"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isCurrentUser = message.sender_id === '1';
                  const messageTime = format(new Date(message.created_at), 'h:mm a');
                  
                  return (
                    <motion.div
                      key={message.id || message.temp_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 relative ${
                          isCurrentUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none shadow'
                        } ${message.temporary ? 'opacity-80' : ''}`}
                      >
                        {message.attachment && (
                          <div className="mb-2 overflow-hidden rounded-lg">
                            {message.attachment.type === 'image' ? (
                              <img 
                                src={message.attachment.url} 
                                alt="Attachment" 
                                className="rounded-lg max-w-full h-auto max-h-60 object-cover"
                              />
                            ) : (
                              <div className="border border-gray-200 rounded-lg p-3 flex items-center bg-white">
                                <FiPaperclip className="mr-2 text-blue-500" />
                                <span className="text-sm truncate max-w-xs">{message.attachment.name}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <p className={isCurrentUser ? 'text-white' : 'text-gray-800'}>{message.content}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                          isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span>{messageTime}</span>
                          {isCurrentUser && (
                            <IoCheckmarkDone className={`${message.is_read ? 'text-blue-200' : 'text-gray-300'}`} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            {otherUserTyping && (
              <div className="flex justify-start mb-3">
                <div className="bg-white rounded-lg rounded-bl-none px-4 py-3 shadow">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-gray-200 bg-white">
            {file && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-2 bg-blue-50 rounded-lg p-2"
              >
                <div className="flex items-center">
                  <FiPaperclip className="mr-2 text-blue-500" />
                  <span className="text-sm truncate max-w-xs">{file.name}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFile(null)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </motion.div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center bg-gray-100 rounded-lg px-3">
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <FiPaperclip className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <button type="button" className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                <BsEmojiSmile className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping(e.target.value.length > 0);
                }}
                placeholder="Type a message..."
                className="flex-1 border-0 focus:outline-none focus:ring-0 text-gray-700 px-2 py-3 bg-transparent"
              />
              <button
                type={newMessage.trim() || file ? "submit" : "button"}
                className={`p-2 rounded-lg transition-colors ${newMessage.trim() || file ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400'}`}
              >
                {newMessage.trim() || file ? (
                  <RiSendPlaneFill className="w-5 h-5" />
                ) : (
                  <BsMicFill className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-col flex-1 items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md text-center">
            <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiMessageSquare className="text-gray-400 text-6xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Your Messages</h3>
            <p className="text-gray-600 mb-6">
              Select a conversation or start a new one to begin messaging.
            </p>
            <button 
              onClick={() => setSearchTerm('')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Conversation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;