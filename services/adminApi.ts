import { apiRequest } from "./api";

type AdminUser = {
	id?: string | number;
	username?: string;
	email?: string;
	avatar?: string;
	role?: string;
	emailVerified?: boolean;
};

export const adminApi = {
	async getUsers(query = "") {
		const suffix = query ? `?search=${encodeURIComponent(query)}` : "";
		return apiRequest<{ users?: unknown[] }>(`/admin/users${suffix}`);
	},
	async updateUser(id: string | number, payload: { status?: string; role?: string }) {
		return apiRequest(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
	},
	async getComments() {
		return apiRequest<{ comments?: unknown[] }>("/admin/comments");
	},
	async createComment(payload: { animeId?: string | number; animeTitle?: string; episode?: number; userId?: string | number; userName?: string; email?: string; text: string; content?: string; sticker?: string; avatar?: string; parentId?: string | number; }) {
		return apiRequest<{ comment?: Record<string, unknown>; data?: Record<string, unknown>; success?: boolean }>("/content/comments", { method: "POST", body: JSON.stringify(payload) });
	},
	async moderateComment(id: string | number, action: "approve" | "delete" | "ban") {
		return apiRequest(`/admin/comments/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
	},
	async getReports() {
		return apiRequest<{ reports?: unknown[] }>("/admin/reports");
	},
	async updateReport(id: string | number, status: "resolved" | "dismissed") {
		return apiRequest(`/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
	},
	async getNotifications() {
		return apiRequest<{ notifications?: unknown[] }>("/admin/notifications");
	},
	async getSchedule() {
		return apiRequest<{ items?: unknown[] }>("/admin/schedule");
	},
	async getBanners() {
		return apiRequest<{ items?: unknown[] }>("/admin/banners");
	},
	async getLogs() {
		return apiRequest<{ items?: unknown[] }>("/admin/logs");
	},	async getSettings() {
		return apiRequest<{ settings?: Record<string, unknown> }>('/admin/settings');
	},
	async updateSettings(payload: Record<string, unknown>) {
		return apiRequest('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) });
	},
	async getThemes() {
		return apiRequest<{ themes?: unknown[] }>('/admin/themes');
	},
	async getActiveTheme() {
		return apiRequest<{ theme?: Record<string, unknown> }>('/admin/themes/active');
	},
	async setActiveTheme(themeId: string) {
		return apiRequest<{ theme?: Record<string, unknown>; result?: Record<string, unknown>; success?: boolean }>(`/admin/themes/${themeId}/activate`, { method: 'PUT' });
	},
	async createTheme(payload: Record<string, unknown>) {
		return apiRequest('/admin/themes', { method: 'POST', body: JSON.stringify(payload) });
	},
	async deleteTheme(themeId: string) {
		return apiRequest(`/admin/themes/${themeId}`, { method: 'DELETE' });
	},
	async getDashboardStats() {
		return apiRequest<{
			totalUsers?: number;
			newUsersToday?: number;
			totalAnime?: number;
			newAnimeToday?: number;
			totalViews?: number;
			viewsToday?: number;
			pendingReports?: number;
			pendingComments?: number;
		}>('/admin/stats');
	},
	async registerAdmin(payload: { username: string; email: string; password: string; phone: string; country: string }) {
		const result = await apiRequest<{ user?: AdminUser; token?: string }>("/auth/admin/register", { method: "POST", body: JSON.stringify(payload) });
		// Store token if provided
		if (result.token) {
			localStorage.setItem("animeSuAuthToken", result.token);
		}
		return result;
	},
	async loginAdmin(payload: { email: string; password: string }) {
		const result = await apiRequest<{ user?: AdminUser; token?: string }>("/auth/admin/login", { method: "POST", body: JSON.stringify(payload) });
		// Store token if provided
		if (result.token) {
			localStorage.setItem("animeSuAuthToken", result.token);
		}
		return result;
	},
	async verifyEmail(email: string, code: string) {
		return apiRequest("/auth/verify-email", { method: "POST", body: JSON.stringify({ email, code }) });
	},
	async resendVerificationEmail(email: string) {
		return apiRequest("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });
	},
};
