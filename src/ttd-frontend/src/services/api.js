import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5230/api'

const client = axios.create({
  baseURL,
  timeout: 15000,
})

export const tokenStore = {
  get: () => localStorage.getItem('ttd_admin_token'),
  set: (token) => localStorage.setItem('ttd_admin_token', token),
  clear: () => localStorage.removeItem('ttd_admin_token'),
}

client.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  login: async (payload) => {
    const { data } = await client.post('/auth/login', payload)
    return data
  },
}

export const publicApi = {
  getHome: async () => (await client.get('/public/home')).data,
  getNews: async () => (await client.get('/public/news')).data,
  getServices: async () => (await client.get('/public/services')).data,
  getMedia: async () => (await client.get('/public/media')).data,
  applyService: async (payload) => (await client.post('/public/services/apply', payload)).data,
  getServiceStatus: async (id) => (await client.get(`/public/services/status/${id}`)).data,
}

export const adminApi = {
  getDashboard: async () => (await client.get('/admin/dashboard')).data,
  getApplications: async () => (await client.get('/admin/applications')).data,
  updateApplicationStatus: async (id, payload) =>
    (await client.patch(`/admin/applications/${id}/status`, payload)).data,
  getUsers: async () => (await client.get('/admin/users')).data,
  createUser: async (payload) => (await client.post('/admin/users', payload)).data,
  updateUserActive: async (id, payload) => (await client.patch(`/admin/users/${id}/active`, payload)).data,
  getCategories: async () => (await client.get('/admin/categories')).data,
  createCategory: async (payload) => (await client.post('/admin/categories', payload)).data,
  getArticles: async () => (await client.get('/admin/articles')).data,
  createArticle: async (payload) => (await client.post('/admin/articles', payload)).data,
  updateArticlePublish: async (id, payload) =>
    (await client.patch(`/admin/articles/${id}/publish`, payload)).data,
}
