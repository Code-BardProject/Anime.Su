import { apiRequest } from "./api";
import { uploadsApi } from "./uploadsApi";

export const database = {
	async loadChatMessages() {
		const result = await apiRequest<{ messages?: unknown[] }>('/admin/chat/messages');
		const messages = Array.isArray(result.messages)
			? result.messages
			: Array.isArray(result.data)
				? result.data
				: [];
		return {
			success: result.success,
			data: messages,
			error: result.success ? undefined : result.error || 'Не удалось загрузить сообщения чата',
		};
	},
	async sendChatMessage(payload: Record<string, unknown>) {
		const result = await apiRequest('/admin/chat/messages', { method: 'POST', body: JSON.stringify(payload) });
		return {
			success: result.success,
			data: result.data ?? result,
			error: result.success ? undefined : result.error || 'Не удалось отправить сообщение',
		};
	},
	async createComment(payload: Record<string, unknown>) {
		const result = await apiRequest('/admin/comments', { method: 'POST', body: JSON.stringify(payload) });
		return {
			success: result.success,
			data: result.data ?? result,
			error: result.success ? undefined : result.error || 'Не удалось отправить комментарий',
		};
	},
	async loadAnimeFromDatabase() {
		const result = await apiRequest<{ items?: unknown[] }>("/admin/anime/public");
		const items = Array.isArray(result.items)
			? result.items
			: Array.isArray(result.data)
				? result.data
				: [];
		return {
			success: result.success,
			data: items,
			error: result.success ? undefined : result.error || "Не удалось загрузить каталог аниме",
		};
	},
	async uploadAnimeMedia(files: File[], kind: "image" | "video") {
		const results = await Promise.all(files.map((file) => kind === "image" ? uploadsApi.uploadAnimeImage(file) : uploadsApi.uploadAnimeVideo(file)));
		return {
			success: results.every((item) => item.success),
			data: results.flatMap((item) => item.data ? [{ id: item.data.filename, name: item.data.filename, url: item.data.url, type: kind }] : []),
			error: results.find((item) => !item.success)?.error,
		};
	},
	async saveAnime(payload: Record<string, unknown>, id?: string) {
		const result = await apiRequest<{ item?: unknown }>(id ? `/admin/anime/${id}` : "/admin/anime", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
		return { success: result.success, data: result.item || result.data, error: result.error };
	},
	async deleteAnime(id: string) { return apiRequest(`/admin/anime/${id}`, { method: "DELETE" }); },
	async createPasswordReset(_email: string) { return { success: true }; },
	async completePasswordReset(email: string, _password: string) { return { success: true, data: { email } }; },
	async logSecurityEvent(_event: string) { return { success: true }; },
};
