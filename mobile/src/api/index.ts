import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const storage = {
  getString: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

console.log('[API] BASE_URL:', BASE_URL);

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log('[API] -->', config.method?.toUpperCase(), config.url);
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => {
    console.log('[API] <--', res.status, res.config.url, Array.isArray(res.data) ? `[${res.data.length} items]` : typeof res.data);
    return res;
  },
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync('refresh_token');
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
        await SecureStore.setItemAsync('access_token', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    console.log('[API] ERR', error.config?.url, error.response?.status, error.message);
    return Promise.reject(error);
  },
);

// ── API Functions ──────────────────────────────────────────────

export const videosApi = {
  getAll:     (params?: any) => api.get('/videos', { params }).then(r => r.data),
  getFeatured:()            => api.get('/videos/featured').then(r => r.data),
  getLatest:  (limit = 10) => api.get('/videos/latest', { params: { limit } }).then(r => r.data),
  getTrending:(limit = 10) => api.get('/videos/trending', { params: { limit } }).then(r => r.data),
  getOne:     (id: number) => api.get(`/videos/${id}`).then(r => r.data),
  getRelated: (id: number) => api.get(`/videos/${id}/related`).then(r => r.data),
  saveProgress:(id: number, progressSeconds: number, totalSeconds?: number) =>
    api.post(`/videos/${id}/progress`, { progressSeconds, totalSeconds }),
  bookmark:          (id: number) => api.post(`/videos/${id}/bookmark`).then(r => r.data),
  unbookmark:        (id: number) => api.delete(`/videos/${id}/bookmark`).then(r => r.data),
  getBookmarkStatus: (id: number) => api.get(`/videos/${id}/bookmark`).then(r => r.data) as Promise<{ bookmarked: boolean }>,
};

export const categoriesApi = {
  getAll:    ()            => api.get('/categories').then(r => r.data),
  getVideos: (slug: string, params?: any) =>
    api.get(`/categories/${slug}/videos`, { params }).then(r => r.data),
};

export const clipsApi = {
  getAll:     (params?: any) => api.get('/clips', { params }).then(r => r.data),
  getFeatured:()             => api.get('/clips/featured').then(r => r.data),
  share:      (id: number)   => api.post(`/clips/${id}/share`).then(r => r.data),
};

export const liveApi = {
  getStatus:  () => api.get('/live/status').then(r => r.data),
  getStream:  () => api.get('/live/stream').then(r => r.data),
  getUpcoming:() => api.get('/live/upcoming').then(r => r.data),
};

export const eventsApi = {
  getAll:     (params?: any) => api.get('/events', { params }).then(r => r.data),
  getUpcoming:()             => api.get('/events/upcoming').then(r => r.data),
  getOne:     (id: number)   => api.get(`/events/${id}`).then(r => r.data),
  getCountdown:(id: number)  => api.get(`/events/${id}/countdown`).then(r => r.data),
};

export const searchApi = {
  search:     (q: string, params?: any) => api.get('/search', { params: { q, ...params } }).then(r => r.data),
  suggestions:(q: string)              => api.get('/search/suggestions', { params: { q } }).then(r => r.data),
};

export const authApi = {
  login:           (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  register:        (email: string, password: string, fullName?: string) =>
    api.post('/auth/register', { email, password, fullName }).then(r => r.data),
  loginWithGoogle: (token: string, tokenType = 'id_token') =>
    api.post('/auth/google', { token, tokenType }).then(r => r.data),
  getMe:           () => api.get('/auth/me').then(r => r.data),
};

export const userApi = {
  getBookmarks: (params?: any) => api.get('/users/bookmarks', { params }).then(r => r.data),
  getHistory:   (params?: any) => api.get('/users/history', { params }).then(r => r.data),
  submitPrayerRequest: (name: string, category: string, request: string) =>
    api.post('/prayer-requests', { name, category: category.toLowerCase(), request }).then(r => r.data),
  registerDeviceToken: (token: string, platform: string) =>
    api.post('/notifications/device-token', { token, platform }),
  getNotificationPrefs: () =>
    api.get('/users/me/notification-preferences').then(r => r.data) as Promise<{ notificationsEnabled: boolean }>,
  updateNotificationPrefs: (data: { notificationsEnabled: boolean }) =>
    api.patch('/users/me/notification-preferences', data).then(r => r.data) as Promise<{ notificationsEnabled: boolean }>,
};

export const momentsApi = {
  getDeclarations: (params?: any) => api.get('/moments/declarations', { params }).then(r => r.data),
  getPrayers:      (params?: any) => api.get('/moments/prayers', { params }).then(r => r.data),
  getTestimonies:  (params?: any) => api.get('/moments/testimonies', { params }).then(r => r.data),
  getSuggestions:  (params: { momentId: number; youtubeId: string; type: string; limit?: number }) =>
    api.get('/moments/suggestions', { params }).then(r => r.data) as Promise<any[]>,
};
