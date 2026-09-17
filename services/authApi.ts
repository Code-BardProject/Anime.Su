import { apiRequest } from "./api";

export const authApi = {
	getAuthHeaders(): Record<string, string> {
		const token = localStorage.getItem("animeSuAuthToken");
		const key = (import.meta as any).env?.VITE_API_KEY as string | undefined;
		return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { "X-API-Key": key } : {}) };
	},
	clearToken() {
		localStorage.removeItem("animeSuAuthToken");
		localStorage.removeItem("animeSuUser");
	},
	async forgotPassword(email: string) {
		return apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
	},
	async verifyResetCode(email: string, code: string) {
		return apiRequest("/auth/verify-reset-code", { method: "POST", body: JSON.stringify({ email, code }) });
	},
	async resetPassword(email: string, code: string, newPassword: string, confirmPassword: string) {
		if (newPassword !== confirmPassword) return { success: false, error: "Пароли не совпадают" };
		return apiRequest("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, code, newPassword }) });
	},
};
