import { useState, useEffect } from "react";
import { getGroups, getGroupPosts, createGroup, joinGroup, leaveGroup, createPost, uploadGroupMedia } from "../../../services/userApi";

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  media?: string[];
  likes: number;
  comments: number;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  type: 'group' | 'clan';
  avatar?: string;
  coverImage?: string;
  memberCount: number;
  isMember: boolean;
  isAdmin: boolean;
  createdAt: string;
}

interface GroupClanProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const fallbackGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Anime Lovers',
    description: 'Обсуждаем новые релизы и рекомендации.',
    type: 'group',
    memberCount: 418,
    isMember: true,
    isAdmin: false,
    createdAt: '2024-01-10',
  },
  {
    id: 'group-2',
    name: 'Shadow Clan',
    description: 'Фан-клуб для любителей мощных сюжетов.',
    type: 'clan',
    memberCount: 256,
    isMember: true,
    isAdmin: true,
    createdAt: '2023-09-24',
  },
];

const fallbackPosts: Post[] = [
  {
    id: 'post-1',
    authorId: 'user-1',
    authorName: 'Aiko',
    content: 'Новая подборка аниме на вечер уже в ленте.',
    likes: 42,
    comments: 9,
    createdAt: 'Сегодня, 18:20',
  },
  {
    id: 'post-2',
    authorId: 'user-2',
    authorName: 'Mina',
    content: 'Кто уже смотрит последнюю серию?',
    likes: 18,
    comments: 4,
    createdAt: 'Вчера, 19:10',
  },
];

export default function GroupClan({ onNavigate }: GroupClanProps) {
  const [groups, setGroups] = useState<Group[]>(fallbackGroups);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(fallbackGroups[0]);
  const [posts, setPosts] = useState<Post[]>(fallbackPosts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', type: 'group' as 'group' | 'clan' });
  const [newPost, setNewPost] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadPosts(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGroups();
      if (data.success && Array.isArray(data.groups)) {
        setGroups(data.groups.length ? data.groups : fallbackGroups);
        if (!selectedGroup && data.groups.length) {
          setSelectedGroup(data.groups[0]);
        }
        return;
      }

      setGroups(fallbackGroups);
      if (!selectedGroup) {
        setSelectedGroup(fallbackGroups[0]);
      }
    } catch (err) {
      console.error(err);
      setGroups(fallbackGroups);
      setSelectedGroup(fallbackGroups[0]);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (groupId: string) => {
    try {
      const data = await getGroupPosts(groupId);
      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const result = await createGroup(newGroup);
      if (result.success) {
        setShowCreateModal(false);
        setNewGroup({ name: '', description: '', type: 'group' });
        loadGroups();
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const result = await joinGroup(groupId);
      if (result.success) {
        loadGroups();
      }
    } catch (err) {
      console.error('Failed to join group:', err);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const result = await leaveGroup(groupId);
      if (result.success) {
        setSelectedGroup(null);
        loadGroups();
      }
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !selectedGroup) return;

    try {
      let mediaUrls: string[] = [];
      if (selectedMedia) {
        const data = await uploadGroupMedia(selectedGroup.id, selectedMedia);
        if (data.success) {
          mediaUrls = [data.url];
        }
      }

      const result = await createPost(selectedGroup.id, {
        content: newPost,
        media: mediaUrls
      });
      if (result.success) {
        setNewPost('');
        setSelectedMedia(null);
        loadPosts(selectedGroup.id);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
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
          onClick={loadGroups}
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
      {/* Groups List */}
      <div className="w-80 border-r border-purple-900/20 flex flex-col" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="p-4 border-b border-purple-900/20">
          <div className="flex items-center justify-between">
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.08em" }}>
              ГРУППЫ И КЛАНЫ
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 rounded"
              style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7" }}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48">
              <p style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 8 }}>👥</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                Нет групп
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className="p-4 border-b border-purple-900/10 cursor-pointer transition-all hover:bg-purple-900/10"
                style={{ 
                  background: selectedGroup?.id === group.id ? "rgba(124,58,237,0.1)" : "transparent"
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
                    {group.type === 'clan' ? '⚔️' : '👥'}
                  </div>
                  <div className="flex-1">
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>
                      {group.name}
                    </span>
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-mono)" }}>
                      {group.type === 'clan' ? 'Клан' : 'Группа'}
                    </span>
                  </div>
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginBottom: 4 }}>
                  {group.description}
                </p>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#4b5563" }}>
                    {group.memberCount} участников
                  </span>
                  {group.isMember ? (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#4ade80" }}>
                      ✓ Участник
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinGroup(group.id);
                      }}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-mono)" }}
                    >
                      Вступить
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Group Content */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <>
            <div className="p-4 border-b border-purple-900/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
                    {selectedGroup.type === 'clan' ? '⚔️' : '👥'}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "#e8e8f0" }}>
                      {selectedGroup.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-mono)" }}>
                      {selectedGroup.type === 'clan' ? 'Клан' : 'Группа'}
                    </span>
                  </div>
                </div>
                {selectedGroup.isMember && (
                  <button
                    onClick={() => handleLeaveGroup(selectedGroup.id)}
                    className="px-3 py-1.5 rounded text-xs"
                    style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", fontFamily: "var(--font-mono)" }}
                  >
                    Покинуть
                  </button>
                )}
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#a0a0b8" }}>
                {selectedGroup.description}
              </p>
            </div>

            {selectedGroup.isMember && (
              <div className="p-4 border-b border-purple-900/20">
                <div className="flex gap-2">
                  <input
                    type="file"
                    onChange={(e) => setSelectedMedia(e.target.files?.[0] || null)}
                    className="hidden"
                    id="post-media"
                    accept="image/*,video/*"
                  />
                  <label
                    htmlFor="post-media"
                    className="p-2 rounded cursor-pointer"
                    style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7" }}
                  >
                    📎
                  </label>
                  <input
                    type="text"
                    placeholder="Написать пост..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="flex-1 px-4 py-2 rounded outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                  />
                  <button
                    onClick={handleCreatePost}
                    className="px-4 py-2 rounded"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
                  >
                    Опубликовать
                  </button>
                </div>
                {selectedMedia && (
                  <div className="mt-2 flex items-center gap-2">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      {selectedMedia.name}
                    </span>
                    <button
                      onClick={() => setSelectedMedia(null)}
                      className="text-xs"
                      style={{ color: "#f87171", background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 8 }}>📝</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
                    Нет постов
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded"
                    style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
                        {post.authorName[0]}
                      </div>
                      <div>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>
                          {post.authorName}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginLeft: 8 }}>
                          {post.createdAt}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#e8e8f0", marginBottom: 12, wordBreak: 'break-word' }}>
                      {post.content}
                    </p>
                    {post.media && post.media.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {post.media.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt="media"
                            className="w-full h-40 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex gap-4">
                      <button className="flex items-center gap-1" style={{ background: 'none', border: 'none', color: "#6b6b8a", fontFamily: "var(--font-mono)", fontSize: 12, cursor: 'pointer' }}>
                        ❤️ {post.likes}
                      </button>
                      <button className="flex items-center gap-1" style={{ background: 'none', border: 'none', color: "#6b6b8a", fontFamily: "var(--font-mono)", fontSize: 12, cursor: 'pointer' }}>
                        💬 {post.comments}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p style={{ fontFamily: "var(--font-display)", fontSize: 48, marginBottom: 16 }}>👥</p>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
                ВЫБЕРИТЕ ГРУППУ
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
                Или создайте новую группу
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded p-6 w-full max-w-md" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              СОЗДАТЬ ГРУППУ
            </h3>
            <div className="space-y-4">
              <div>
                <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                  Тип
                </label>
                <select
                  value={newGroup.type}
                  onChange={(e) => setNewGroup({ ...newGroup, type: e.target.value as 'group' | 'clan' })}
                  className="w-full px-4 py-3 rounded outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                >
                  <option value="group">Группа</option>
                  <option value="clan">Клан</option>
                </select>
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                  Название
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-4 py-3 rounded outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                  Описание
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-4 py-3 rounded outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14, minHeight: 80 }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 rounded text-sm"
                style={{ background: "rgba(255,255,255,0.04)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
              >
                Отмена
              </button>
              <button
                onClick={handleCreateGroup}
                className="flex-1 py-2 rounded text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
