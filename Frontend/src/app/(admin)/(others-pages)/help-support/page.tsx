"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Search, Paperclip, Smile, Send, User } from 'lucide-react';

export default function ChatPage() {

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello!",
      sender: "customer",
      time: "09 Sep 2023 05:42 pm"
    },
    {
      id: 2,
      text: "I need your argent help..",
      sender: "customer",
      time: "09 Sep 2023 05:42 pm"
    },
    {
      id: 3,
      text: "Yes. How can I help you ?",
      sender: "restaurant",
      time: "09 Sep 2023 05:43 pm"
    },
    {
      id: 4,
      text: "I order small size pizza .but now I want medium size pizza. Can you change it?",
      sender: "customer",
      time: "09 Sep 2023 05:44 pm"
    },
    {
      id: 5,
      text: "Yes. please send your order id.",
      sender: "restaurant",
      time: "09 Sep 2023 05:45 pm",
      isButton: true
    },
    {
      id: 6,
      text: "Order Id: 100030",
      sender: "customer",
      time: "12 Sep 2025 02:15 am"
    },
    {
      id: 7,
      text: "Sorry order id :100050",
      sender: "customer",
      time: "12 Sep 2025 02:16 am"
    },
    {
      id: 8,
      text: "I changed your order.",
      sender: "restaurant",
      time: "12 Sep 2025 02:16 am",
      isButton: true
    }
  ]);

  const adminConversations = [
    {
      id: 1,
      name: "John Smith",
      phone: "+91 98765 43210",
      lastMessage: "Need help with user management",
      time: "2 min ago",
      avatar: "JS"
    },
    {
      id: 2,
      name: "Sarah Wilson",
      phone: "+91 87654 32109",
      lastMessage: "Restaurant approval pending",
      time: "5 min ago",
      avatar: "SW"
    },
    {
      id: 3,
      name: "Mike Johnson",
      phone: "+91 76543 21098",
      lastMessage: "Payment gateway issue",
      time: "10 min ago",
      avatar: "MJ"
    },
    {
      id: 4,
      name: "Emily Davis",
      phone: "+91 65432 10987",
      lastMessage: "Order analytics report ready",
      time: "15 min ago",
      avatar: "ED"
    },
    {
      id: 5,
      name: "David Brown",
      phone: "+91 54321 09876",
      lastMessage: "Customer complaint resolved",
      time: "20 min ago",
      avatar: "DB"
    }
  ];

  const conversations = adminConversations;

  // Auto scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        sender: "admin",
        time: new Date().toLocaleString(),
        isButton: false
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Conversation List */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Conversations
          </h2>
          
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Super Admin Header */}
          <div className="flex items-center justify-center py-2 px-4 text-black rounded-lg">
            <span className="text-sm font-medium">Super Admin </span>
          </div>
        </div>

        {/* Conversation List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`p-3 cursor-pointer transition-colors ${
                selectedConversation?.id === conversation.id
                  ? 'bg-blue-100 border-l-4 border-blue-600'
                  : 'bg-white border-l-4 border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                  {conversation.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {conversation.time}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mb-1">
                    {conversation.phone}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header - Fixed */}
        <div className="bg-white p-4 border-b border-gray-200 shadow-sm flex-shrink-0">
          {selectedConversation ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {selectedConversation.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">{selectedConversation.name}</h3>
                <p className="text-sm text-blue-600">{selectedConversation.phone}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>

        {/* Chat Messages - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {selectedConversation ? (
            <div className="space-y-4">
              {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div
                  className={`flex ${
                    msg.sender === 'customer' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                      msg.sender === 'customer'
                        ? 'bg-white text-gray-800 rounded-bl-sm'
                        : 'bg-blue-600 text-white rounded-br-sm'
                    } shadow-sm`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
                
                {msg.isButton && (
                  <div className="flex justify-end">
                    <div className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm max-w-xs lg:max-w-md">
                      {msg.text}
                    </div>
                  </div>
                )}
                
                <p
                  className={`text-xs text-gray-500 px-1 ${
                    msg.sender === 'customer' ? 'text-left' : 'text-right'
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg">Select a conversation to view messages</p>
            </div>
          )}
        </div>

        {/* Message Input - Fixed at Bottom */}
        <div className="bg-white p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0">
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}