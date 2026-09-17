const configuredApiUrl = ((import.meta as any).env?.VITE_API_URL || "/api").replace(/\/+$/, "");
const isLanClient = typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_URL = isLanClient && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/api)?$/i.test(configuredApiUrl)
	? "/api"
	: configuredApiUrl;
const API_BASE_URL = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;
const API_KEY = (import.meta as any).env?.VITE_API_KEY as string | undefined;

export type ApiResult<T = unknown> = {
	success: boolean;
	data?: T;
	token?: string;
	error?: string;
	[key: string]: unknown;
};

const buildRequestUrl = (path: string): string => {
	const normalizedPath = path.trim();
	if (/^https?:\/\//i.test(normalizedPath)) {
		return normalizedPath;
	}

	const relativePath = normalizedPath.startsWith("/") ? normalizedPath.slice(1) : normalizedPath;
	if (API_BASE_URL.startsWith("/")) {
		return `${API_BASE_URL}/${relativePath}`;
	}
	return new URL(relativePath, `${API_BASE_URL}/`).toString();
};

export const apiRequest = async <T = unknown>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> => {
	const headers = new Headers(init.headers);
	headers.set("Content-Type", "application/json");
	if (API_KEY) headers.set("X-API-Key", API_KEY);
	const token = localStorage.getItem("animeSuAuthToken");
	if (token) headers.set("Authorization", `Bearer ${token}`);

	try {
		const requestUrl = buildRequestUrl(path);
		const response = await fetch(requestUrl, {
			...init,
			headers,
		});
		const body = await response.json().catch(() => ({}));

		const responseToken = body.token ?? body.data?.token;
		if (responseToken) {
			localStorage.setItem("animeSuAuthToken", responseToken);
		}

		return {
			...body,
			data: body.data ?? body,
			success: body.success ?? response.ok,
			error: body.error || (!response.ok ? `Request failed (${response.status})` : undefined),
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Network request failed",
		};
	}
};

export const getApiBaseUrl = () => API_BASE_URL;
