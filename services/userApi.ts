import { apiRequest } from "./api";

type Credentials = { email: string; password: string };

export const registerUser = async (payload: { username: string; email: string; password: string }) => {
	const result = await apiRequest<{ user?: Record<string, unknown>; token?: string }>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
	// Store token if provided
	if (result.token) {
		localStorage.setItem("animeSuAuthToken", result.token);
	}
	return result;
};

export const loginUser = async (payload: Credentials) => {
	const result = await apiRequest<{ user?: Record<string, unknown>; token?: string }>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
	// Store token if provided
	if (result.token) {
		localStorage.setItem("animeSuAuthToken", result.token);
	}
	return result;
};

export const verifyEmail = (payload: { email: string; code: string }) =>
	apiRequest("/auth/verify-email", { method: "POST", body: JSON.stringify(payload) });

export const resendVerificationEmail = (email: string) =>
	apiRequest("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });

const userRequest = (path: string, init?: RequestInit) => apiRequest(path, init);
export const getContinueWatching = () => userRequest("/admin/continue-watching");
export const updateContinueWatching = (payload: { animeId: string; episode: number; timestamp: number }) => userRequest("/admin/continue-watching", { method: "POST", body: JSON.stringify(payload) });
export const removeContinueWatching = (id: string) => userRequest(`/admin/continue-watching/${id}`, { method: "DELETE" });
export const getFavorites = () => userRequest("/admin/favorites");
export const updateFavoriteRating = (id: string, rating: number) => userRequest(`/admin/favorites/${id}/rating`, { method: "PUT", body: JSON.stringify({ rating }) });
export const removeFavorite = (id: string) => userRequest(`/admin/favorites/${id}`, { method: "DELETE" });
export const getHistory = (query?: { limit?: number; offset?: number }) => {
	const params = new URLSearchParams();
	if (query?.limit) params.set("limit", String(query.limit));
	if (query?.offset) params.set("offset", String(query.offset));
	const suffix = params.toString() ? `?${params.toString()}` : "";
	return userRequest(`/admin/history${suffix}`);
};
export const clearHistory = () => userRequest("/admin/history", { method: "DELETE" });
export const removeHistoryItem = (id: string) => userRequest(`/admin/history/${id}`, { method: "DELETE" });
export const getNotifications = () => userRequest("/admin/notifications");
export const markNotificationAsRead = (id: string) => userRequest(`/admin/notifications/${id}/read`, { method: "PUT" });
export const markAllNotificationsAsRead = () => userRequest("/admin/notifications/read-all", { method: "PUT" });
export const deleteNotification = (id: string) => userRequest(`/admin/notifications/${id}`, { method: "DELETE" });
export const getSettings = () => userRequest("/admin/settings");
export const getThemes = () => userRequest("/admin/themes");
export const getActiveTheme = () => userRequest("/admin/themes/active");
export const setActiveTheme = (themeId: string) => userRequest(`/admin/themes/${themeId}/activate`, { method: "PUT" });
export const getWatchlist = () => userRequest("/admin/watchlist");
export const updateWatchlistItem = (id: string, payload: unknown) => userRequest(`/admin/watchlist/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const removeWatchlistItem = (id: string) => userRequest(`/admin/watchlist/${id}`, { method: "DELETE" });
export const getGroups = () => userRequest("/groups");
export const getGroupPosts = (groupId: string) => userRequest(`/groups/${groupId}/posts`);
export const createGroup = (payload: unknown) => userRequest("/groups", { method: "POST", body: JSON.stringify(payload) });
export const joinGroup = (groupId: string) => userRequest(`/groups/${groupId}/join`, { method: "POST" });
export const leaveGroup = (groupId: string) => userRequest(`/groups/${groupId}/leave`, { method: "POST" });
export const createPost = (payload: unknown) => userRequest("/groups/posts", { method: "POST", body: JSON.stringify(payload) });
export const getConversations = () => userRequest("/chat/conversations");
export const getMessages = (conversationId: string) => userRequest(`/chat/conversations/${conversationId}/messages`);
export const sendMessage = (payload: unknown) => userRequest("/chat/messages", { method: "POST", body: JSON.stringify(payload) });
export const createConversation = (payload: unknown) => userRequest("/chat/conversations", { method: "POST", body: JSON.stringify(payload) });
export const uploadChatMedia = (file: File) => Promise.resolve({ success: false, error: "Используйте uploadsApi для загрузки файлов" });
export const uploadGroupMedia = (file: File) => Promise.resolve({ success: false, error: "Используйте uploadsApi для загрузки файлов" });
