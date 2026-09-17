import { useState, useEffect, useRef } from "react";
import { getConversations, getMessages, sendMessage, createConversation, uploadChatMedia } from "../../../services/userApi";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface UserweChatProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const fallbackConversations: Conversation[] = [
  {
    id: 'conv-1',
    userId: 'user-1',
    userName: 'Aiko',
    lastMessage: 'Понравилась твоя рекомендация по аниме.',
    lastMessageTime: '10:42',
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    userId: 'user-2',
    userName: 'Mina',
    lastMessage: 'Готов обсудить новую главу.',
    lastMessageTime: 'Вчера',
    unreadCount: 0,
  },
];

const fallbackMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'user-1',
    senderName: 'Aiko',
    content: 'Привет! Какие аниме посоветуешь посмотреть сегодня?',
    type: 'text',
    createdAt: '10:38',
  },
  {
    id: 'msg-2',
    senderId: 'me',
    senderName: 'Вы',
    content: 'Посмотри Jujutsu Kaisen и Frieren — это отличный выбор.',
    type: 'text',
    createdAt: '10:40',
  },
];

export default function UserweChat({ onNavigate }: UserweChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>(fallbackConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(fallbackConversations[0]);
  const [messages, setMessages] = useState<Message[]>(fallbackMessages);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConversations();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations.length ? data.conversations : fallbackConversations);
        if (!selectedConversation && data.conversations.length) {
          setSelectedConversation(data.conversations[0]);
        }
        return;
      }

      setConversations(fallbackConversations);
      if (!selectedConversation) {
        setSelectedConversation(fallbackConversations[0]);
      }
    } catch (err) {
      console.error(err);
      setConversations(fallbackConversations);
      setSelectedConversation(fallbackConversations[0]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await getMessages(conversationId);
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const result = await sendMessage(selectedConversation.id, {
        content: newMessage,
        type: 'text'
      });
      if (result.success) {
        setNewMessage('');
        loadMessages(selectedConversation.id);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleCreateConversation = async () => {
    if (!searchUser.trim()) return;

    try {
      const result = await createConversation({ userId: searchUser });
      if (result.success) {
        setShowNewChat(false);
        setSearchUser('');
        loadConversations();
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleMediaUpload = async (file: File) => {
    if (!selectedConversation) return;

    try {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const data = await uploadChatMedia(selectedConversation.id, file);
      if (data.success) {
        const result = await sendMessage(selectedConversation.id, {
          content: data.url,
          type
        });
        if (result.success) {
          loadMessages(selectedConversation.id);
        }
      }
    } catch (err) {
      console.error('Failed to upload media:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f87171", marginBottom: 12 }}>{error}</p>
        <button
          onClick={loadConversations}
          className="px-4 py-2 rounded text-sm"
          style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-display)" }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Conversations List */}
      <div className="w-80 border-r border-purple-900/20 flex flex-col" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="p-4 border-b border-purple-900/20">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.08em" }}>
              ЧАТЫ
            </h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 rounded"
              style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7" }}
            >
              +
            </button>
          </div>
        </div>

        {showNewChat && (
          <div className="p-4 border-b border-purple-900/20">
            <input
              type="text"
              placeholder="ID пользователя..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full px-3 py-2 rounded mb-2 outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 13 }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateConversation}
                className="flex-1 py-2 rounded text-xs"
                style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-display)" }}
              >
                Создать
              </button>
              <button
                onClick={() => setShowNewChat(false)}
                className="flex-1 py-2 rounded text-xs"
                style={{ background: "rgba(255,255,255,0.04)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48">
              <p style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 8 }}>💬</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                Нет чатов
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className="p-4 border-b border-purple-900/10 cursor-pointer transition-all hover:bg-purple-900/10"
                style={{ 
                  background: selectedConversation?.id === conv.id ? "rgba(124,58,237,0.1)" : "transparent"
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>
                    {conv.userName}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: "#a855f7", color: "#fff", fontFamily: "var(--font-mono)" }}>
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                  {conv.lastMessage || 'Нет сообщений'}
                </p>
                {conv.lastMessageTime && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#4b5563" }}>
                    {conv.lastMessageTime}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-purple-900/20">
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#e8e8f0" }}>
                {selectedConversation.userName}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
                    Начните диалог
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[70%] p-3 rounded ${
                      msg.senderId === 'current' ? 'ml-auto' : 'mr-auto'
                    }`}
                    style={{ 
                      background: msg.senderId === 'current' ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(124,58,237,0.12)"
                    }}
                  >
                    {msg.type === 'image' && msg.mediaUrl && (
                      <img src={msg.mediaUrl} alt="image" className="max-w-full rounded mb-2" />
                    )}
                    {msg.type === 'video' && msg.mediaUrl && (
                      <video src={msg.mediaUrl} controls className="max-w-full rounded mb-2" />
                    )}
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#e8e8f0", wordBreak: 'break-word' }}>
                      {msg.content}
                    </p>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", display: 'block', marginTop: 4 }}>
                      {msg.createdAt}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-purple-900/20">
              <div className="flex gap-2">
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])}
                  className="hidden"
                  id="media-upload"
                  accept="image/*,video/*"
                />
                <label
                  htmlFor="media-upload"
                  className="p-2 rounded cursor-pointer"
                  style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7" }}
                >
                  📎
                </label>
                <input
                  type="text"
                  placeholder="Написать сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 rounded outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 rounded"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
                >
                  Отправить
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p style={{ fontFamily: "var(--font-display)", fontSize: 48, marginBottom: 16 }}>💬</p>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
                ВЫБЕРИТЕ ЧАТ
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
                Или создайте новый диалог
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
