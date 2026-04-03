import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5118/api'
const FALLBACK_CATEGORY_NAME = 'Thông tin chung'

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

const safeArray = (value) => (Array.isArray(value) ? value : [])
const extractList = (value) => {
  if (Array.isArray(value)) {
    return value
  }

  if (Array.isArray(value?.value)) {
    return value.value
  }

  return []
}

const categoryNameFromId = (id) => {
  if (!id || Number.isNaN(Number(id))) {
    return FALLBACK_CATEGORY_NAME
  }

  return `Danh mục ${id}`
}

const parseApiErrorMessage = (error, fallbackMessage) => {
  const payload = error?.response?.data
  if (typeof payload === 'string') {
    return payload
  }

  return payload?.message ?? error?.message ?? fallbackMessage
}

const normalizeArticle = (item) => {
  if (!item || typeof item !== 'object') {
    return {
      id: 0,
      title: '',
      summary: '',
      content: '',
      category: '',
      thumbnailUrl: '',
      publishedAt: null,
    }
  }

  return {
    id: item.id ?? item.Id ?? 0,
    title: item.title ?? item.tieuDe ?? item.TieuDe ?? item.name ?? '',
    summary: item.summary ?? item.moTaNgan ?? item.MoTaNgan ?? item.description ?? '',
    content: item.content ?? item.noiDung ?? item.NoiDung ?? '',
    category:
      item.category ??
      item.danhMuc ??
      item.DanhMuc ??
      categoryNameFromId(item.categoryId ?? item.danhMucId ?? item.DanhMucId),
    thumbnailUrl: item.thumbnailUrl ?? item.hinhAnh ?? item.HinhAnh ?? '',
    publishedAt: item.publishedAt ?? item.ngayDang ?? item.NgayDang ?? null,
    viewCount: item.viewCount ?? item.luotXem ?? item.LuotXem ?? 0,
    comments: safeArray(item.comments ?? item.binhLuans).map((comment) => ({
      authorName: comment.authorName ?? comment.tenNguoiDung ?? 'Ẩn danh',
      content: comment.content ?? comment.noiDung ?? '',
      createdAt: comment.createdAt ?? comment.ngayTao ?? null,
    })),
  }
}

const toArticlePayload = (payload) => {
  const body = {
    categoryId: payload.categoryId ? Number(payload.categoryId) : 0,
    title: payload.title?.trim() ?? '',
    summary: payload.summary?.trim() ?? '',
    content: payload.content?.trim() ?? '',
    thumbnailUrl: payload.thumbnailUrl?.trim() ?? '',
    isPublished: Boolean(payload.isPublished),
  }

  return {
    ...body,
    id: payload.id ? Number(payload.id) : undefined,
    tacGiaId: payload.tacGiaId ?? null,
    danhMucId: body.categoryId,
    tieuDe: body.title,
    noiDung: body.content,
    trangThai: body.isPublished ? 'Cong khai' : 'Ban nhap',
  }
}

export const authApi = {
  login: async (payload) => {
    const body = {
      email: payload.email ?? '',
      matKhau: payload.password ?? payload.matKhau ?? '',
    }
    const { data } = await client.post('/Auth/login', body)

    if (data?.success === false) {
      throw new Error(data?.message ?? 'Đăng nhập thất bại')
    }

    return data
  },
  register: async (payload) => {
    const body = {
      email: payload.email ?? '',
      matKhau: payload.password ?? payload.matKhau ?? '',
    }
    const { data } = await client.post('/Auth/register', body)

    if (data?.success === false) {
      throw new Error(data?.message ?? 'Đăng ký thất bại')
    }

    return data
  },
  me: async () => {
    const { data } = await client.get('/Auth/me')
    return data
  },
}

export const publicApi = {
  getHome: async () => {
    const news = await publicApi.getNews()

    return {
      commune: 'Xã Tân Thuận Đông - Thành phố Cao Lãnh - Đồng Tháp',
      bannerTitle: 'Cổng thông tin điện tử xã Tân Thuận Đông',
      featuredNews: news.slice(0, 4),
      serviceLinks: [
        'Nộp hồ sơ trực tuyến',
        'Tra cứu hồ sơ',
        'Tin tức địa phương',
        'Liên hệ chính quyền',
      ],
      statistics: {
        Population: 18500,
        AreaKm2: 32.4,
        OnlineApplications: 0,
        ActiveServices: 0,
      },
    }
  },
  getIntroduction: async () => ({
    history:
      'Xã Tân Thuận Đông đẩy mạnh chuyển đổi số, công khai thông tin và cung cấp tiện ích trực tuyến cho người dân.',
    location: 'Phía Đông thành phố Cao Lãnh, tỉnh Đồng Tháp',
    naturalConditions: 'Địa hình đồng bằng, thuận lợi phát triển nông nghiệp và dịch vụ',
    populationStructure: 'Dân cư tập trung tại các ấp, tỷ lệ lao động trẻ tương đối cao',
    infrastructure: 'Hạ tầng giao thông và viễn thông đang được cải thiện theo hướng số hóa',
  }),
  getNews: async () => {
    const { data } = await client.get('/BaiViet')

    return extractList(data).map((item) => {
      const normalized = normalizeArticle(item)
      return {
        ...normalized,
        summary:
          normalized.summary ||
          normalized.content?.slice(0, 160) ||
          'Bài viết đang được cập nhật tóm tắt.',
        thumbnailUrl:
          normalized.thumbnailUrl ||
          'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
      }
    })
  },
  getNewsDetail: async (id) => {
    const { data } = await client.get(`/BaiViet/${id}`)
    return normalizeArticle(data)
  },
  addNewsComment: async () => ({ message: 'API hiện tại chưa cung cấp endpoint gửi bình luận từ frontend.' }),
  getServices: async () => [],
  getMedia: async () => [],
  applyService: async () => ({
    message: 'API hiện tại chưa cung cấp endpoint nộp hồ sơ.',
    applicationId: 0,
  }),
  getServiceStatus: async () => ({ message: 'API hiện tại chưa cung cấp endpoint tra cứu hồ sơ.' }),
  sendContact: async () => ({
    message: 'API hiện tại chưa cung cấp endpoint liên hệ.',
  }),
}

export const adminApi = {
  getDashboard: async () => {
    const [articles, me] = await Promise.all([
      adminApi.getArticles(),
      authApi.me().catch(() => null),
    ])

    return {
      totalUsers: me ? 1 : 0,
      totalArticles: articles.length,
      totalServices: 0,
      totalApplications: 0,
      totalViews: articles.reduce((sum, item) => sum + Number(item.viewCount ?? 0), 0),
      monthlyApplications: [],
    }
  },
  getApplications: async () => [],
  updateApplicationStatus: async () => ({ message: 'API hiện tại chưa hỗ trợ cập nhật hồ sơ.' }),
  getUsers: async () => {
    const me = await authApi.me().catch(() => null)
    if (!me) {
      return []
    }

    return [
      {
        id: me.id ?? 'me',
        fullName: me.ten ?? me.email ?? 'Tài khoản hiện tại',
        email: me.email ?? '',
        roles: me.vaiTro ? [me.vaiTro] : [],
        isActive: true,
      },
    ]
  },
  createUser: async () => ({ message: 'API hiện tại chưa hỗ trợ quản lý người dùng.' }),
  updateUserActive: async () => ({ message: 'API hiện tại chưa hỗ trợ quản lý người dùng.' }),
  getCategories: async () => {
    const { data } = await client.get('/BaiViet')
    const articles = extractList(data)
    const categoryIds = [...new Set(articles.map((item) => Number(item?.danhMucId ?? 0)).filter((id) => id > 0))]

    if (categoryIds.length === 0) {
      return [{ id: 1, name: categoryNameFromId(1), slug: 'danh-muc-1' }]
    }

    return categoryIds.map((id) => ({
      id,
      name: categoryNameFromId(id),
      slug: `danh-muc-${id}`,
    }))
  },
  createCategory: async () => ({ message: 'API hiện tại chưa hỗ trợ tạo danh mục.' }),
  getArticles: async () => {
    const { data } = await client.get('/BaiViet')
    return extractList(data).map((item) => {
      const normalized = normalizeArticle(item)
      return {
        id: normalized.id,
        title: normalized.title,
        summary: normalized.summary,
        thumbnailUrl:
          normalized.thumbnailUrl ||
          'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
        isPublished: String(item.trangThai ?? '').toLowerCase() === 'cong khai',
        publishedAt: normalized.publishedAt,
        viewCount: normalized.viewCount,
        createdBy: item.createdBy ?? item.tacGia ?? item.TacGia ?? 'Không rõ',
        tacGiaId: item.tacGiaId ?? item.TacGiaId ?? null,
        categoryId: item.categoryId ?? item.danhMucId ?? item.DanhMucId ?? 0,
        categoryName: normalized.category,
      }
    })
  },
  getArticleDetail: async (id) => {
    const { data } = await client.get(`/BaiViet/${id}`)
    const article = normalizeArticle(data)

    return {
      id: article.id,
      title: article.title,
      summary: article.summary || article.content?.slice(0, 160) || '',
      content: article.content,
      thumbnailUrl: article.thumbnailUrl,
      categoryId: data?.categoryId ?? data?.danhMucId ?? data?.DanhMucId ?? 0,
      isPublished: String(data?.trangThai ?? '').toLowerCase() === 'cong khai',
      tacGiaId: data?.tacGiaId ?? data?.TacGiaId ?? null,
    }
  },
  createArticle: async (payload) => {
    try {
      return (await client.post('/BaiViet', toArticlePayload(payload))).data
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không tạo được bài viết.'))
    }
  },
  updateArticle: async (id, payload) => {
    const detail = await adminApi.getArticleDetail(id)
    const body = toArticlePayload({
      ...payload,
      id,
      tacGiaId: detail.tacGiaId,
    })
    return (await client.put(`/BaiViet/${id}`, body)).data
  },
  updateArticlePublish: async (id, payload) => {
    const detail = await client.get(`/BaiViet/${id}`)
    const raw = detail?.data ?? {}
    const body = {
      id,
      tieuDe: raw.tieuDe ?? raw.title ?? '',
      noiDung: raw.noiDung ?? raw.content ?? '',
      danhMucId: raw.danhMucId ?? raw.categoryId ?? 1,
      tacGiaId: raw.tacGiaId ?? null,
      trangThai: payload?.isPublished ? 'Cong khai' : 'Ban nhap',
    }

    return (await client.put(`/BaiViet/${id}`, body)).data
  },
}
