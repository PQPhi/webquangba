import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { adminApi, authApi, publicApi, tokenStore } from './services/api'
import './App.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const APPLICATION_STATUS_MAP = {
  1: 'Cho duyet',
  2: 'Da tiep nhan',
  3: 'Dang xu ly',
  4: 'Da duyet',
  5: 'Khong duyet',
}

const APPLICATION_STATUS_CODE_BY_NAME = {
  New: 1,
  Received: 2,
  Processing: 3,
  Completed: 4,
  Rejected: 5,
}

const APPLICATION_STATUS_OPTIONS = [
  { value: 1, label: 'Cho duyet' },
  { value: 3, label: 'Dang xu ly' },
  { value: 4, label: 'Da duyet' },
  { value: 5, label: 'Khong duyet' },
]

function formatApplicationStatus(value) {
  if (typeof value === 'number') {
    return APPLICATION_STATUS_MAP[value] ?? `Khac (${value})`
  }

  if (typeof value === 'string') {
    const code = Number(value)
    if (!Number.isNaN(code) && APPLICATION_STATUS_MAP[code]) {
      return APPLICATION_STATUS_MAP[code]
    }

    const enumCode = APPLICATION_STATUS_CODE_BY_NAME[value]
    if (enumCode) {
      return APPLICATION_STATUS_MAP[enumCode]
    }

    return value
  }

  return 'Chua cap nhat'
}

function statusCodeFromValue(value) {
  if (typeof value === 'number') {
    return value
  }

  const parsed = Number(value)
  if (!Number.isNaN(parsed)) {
    return parsed
  }

  const enumCode = APPLICATION_STATUS_CODE_BY_NAME[value]
  if (enumCode) {
    return enumCode
  }

  return 1
}

function GatewayPage() {
  return (
    <main className="gateway-bg">
      <section className="gateway-card">
        <p className="eyebrow">Cao Lanh - Dong Thap</p>
        <h1>Cong Thong Tin Xa Tan Thuan Dong</h1>
        <p>
          Nen tang quang ba thong tin dia phuong, dich vu hanh chinh va kenh
          tuong tac cong dan.
        </p>
        <div className="gateway-actions">
          <a href="/portal" target="_blank" rel="noreferrer" className="btn-primary">
            Mo tab nguoi dung
          </a>
          <a href="/admin" target="_blank" rel="noreferrer" className="btn-outline">
            Mo tab quan tri
          </a>
        </div>
      </section>
    </main>
  )
}

function UserPortal() {
  const [home, setHome] = useState(null)
  const [news, setNews] = useState([])
  const [services, setServices] = useState([])
  const [media, setMedia] = useState([])
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [applicationId, setApplicationId] = useState('')
  const [newsFilter, setNewsFilter] = useState('All')
  const [mediaFilter, setMediaFilter] = useState('All')
  const [applyMessage, setApplyMessage] = useState('')
  const [applyForm, setApplyForm] = useState({
    serviceProcedureId: '',
    applicantName: '',
    applicantPhone: '',
    applicantEmail: '',
    note: '',
  })

  useEffect(() => {
    const load = async () => {
      const [homeRes, newsRes, serviceRes, mediaRes] = await Promise.all([
        publicApi.getHome(),
        publicApi.getNews(),
        publicApi.getServices(),
        publicApi.getMedia(),
      ])
      setHome(homeRes)
      setNews(newsRes)
      setServices(serviceRes)
      setMedia(mediaRes)
      if (serviceRes.length > 0) {
        setApplyForm((prev) => ({ ...prev, serviceProcedureId: String(serviceRes[0].id) }))
      }
    }

    load().catch(() => {
      setHome(null)
    })
  }, [])

  const newsCategories = useMemo(() => {
    const categories = news.map((item) => item.category).filter(Boolean)
    return ['All', ...new Set(categories)]
  }, [news])

  const filteredNews = useMemo(() => {
    if (newsFilter === 'All') {
      return news
    }

    return news.filter((item) => item.category === newsFilter)
  }, [news, newsFilter])

  const filteredMedia = useMemo(() => {
    if (mediaFilter === 'All') {
      return media
    }

    return media.filter((item) => item.type === mediaFilter)
  }, [media, mediaFilter])

  const checkStatus = async (event) => {
    event.preventDefault()
    if (!applicationId) {
      return
    }

    try {
      const result = await publicApi.getServiceStatus(applicationId)
      setApplicationStatus(result)
    } catch {
      setApplicationStatus({ message: 'Khong tim thay ho so' })
    }
  }

  const applyService = async (event) => {
    event.preventDefault()
    setApplyMessage('')

    if (!applyForm.serviceProcedureId || !applyForm.applicantName || !applyForm.applicantPhone) {
      setApplyMessage('Vui long nhap day du thong tin bat buoc.')
      return
    }

    try {
      const payload = {
        ...applyForm,
        serviceProcedureId: Number(applyForm.serviceProcedureId),
      }
      const result = await publicApi.applyService(payload)
      setApplyMessage(`${result.message} Ma ho so cua ban: ${result.applicationId}`)
      setApplicationId(String(result.applicationId))
      setApplyForm((prev) => ({
        ...prev,
        applicantName: '',
        applicantPhone: '',
        applicantEmail: '',
        note: '',
      }))
    } catch (error) {
      setApplyMessage(error?.response?.data?.message ?? 'Khong gui duoc ho so. Vui long thu lai.')
    }
  }

  return (
    <div className="portal-shell">
      <header className="topbar">
        <h2>Tan Thuan Dong Portal</h2>
        <nav>
          <a href="#gioi-thieu">Gioi thieu</a>
          <a href="#tin-tuc">Tin tuc</a>
          <a href="#dich-vu">Dich vu hanh chinh</a>
          <a href="#thu-vien">Thu vien</a>
          <a href="#lien-he">Lien he</a>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Trang nguoi dung</p>
          <h1>{home?.bannerTitle ?? 'Dang tai du lieu...'}</h1>
          <p>{home?.commune ?? 'Thong tin tong quan xa Tan Thuan Dong.'}</p>
          <div className="hero-actions">
            <a href="#tin-tuc" className="btn-primary">
              Xem tin noi bat
            </a>
            <a href="#dich-vu" className="btn-outline">
              Thu tuc nhanh
            </a>
          </div>
        </div>
        <div className="hero-side">
          <figure className="hero-media">
            <img
              src="https://images.unsplash.com/photo-1472653525502-f9c3c7f4f2c8?auto=format&fit=crop&w=1200&q=80"
              alt="Canh quan nong nghiep tai Dong Thap"
              loading="lazy"
            />
          </figure>
          <div className="stats">
            <article>
              <strong>{home?.statistics?.Population ?? '--'}</strong>
              <span>Dan so</span>
            </article>
            <article>
              <strong>{home?.statistics?.AreaKm2 ?? '--'}</strong>
              <span>Dien tich km2</span>
            </article>
            <article>
              <strong>{home?.statistics?.OnlineApplications ?? '--'}</strong>
              <span>Ho so truc tuyen</span>
            </article>
            <article>
              <strong>{home?.statistics?.ActiveServices ?? '--'}</strong>
              <span>Dich vu dang mo</span>
            </article>
          </div>
        </div>
      </section>

      <section id="gioi-thieu" className="panel">
        <div className="intro-layout">
          <div>
            <h3>Gioi thieu dia phuong</h3>
            <p>
              Tan Thuan Dong co vi tri thuan loi ket noi trung tam thanh pho Cao Lanh,
              phat trien nong nghiep cong nghe cao va dich vu thuong mai nong thon.
            </p>
          </div>
          <figure>
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80"
              alt="Mo hinh canh tac hien dai"
              loading="lazy"
            />
          </figure>
        </div>
      </section>

      <section id="tin-tuc" className="panel">
        <h3>Tin tuc noi bat</h3>
        <div className="chip-group">
          {newsCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={newsFilter === category ? 'chip is-active' : 'chip'}
              onClick={() => setNewsFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="grid-3">
          {filteredNews.map((item) => (
            <article key={item.id} className="news-card">
              <img src={item.thumbnailUrl} alt={item.title} />
              <div>
                <small>{item.category}</small>
                <h4>{item.title}</h4>
                <p>{item.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="dich-vu" className="panel">
        <h3>Dich vu hanh chinh</h3>
        <div className="service-table">
          {services.map((service) => (
            <article key={service.id}>
              <h4>
                {service.code} - {service.name}
              </h4>
              <p>{service.description}</p>
              <p>
                Bieu mau: <a href={service.formUrl}>Tai xuong</a>
              </p>
            </article>
          ))}
        </div>

        <div className="service-actions-grid">
          <form className="application-form" onSubmit={applyService}>
            <h4>Gui don truc tiep tren web</h4>
            <label htmlFor="service-id">Thu tuc</label>
            <select
              id="service-id"
              value={applyForm.serviceProcedureId}
              onChange={(event) =>
                setApplyForm((prev) => ({ ...prev, serviceProcedureId: event.target.value }))
              }
            >
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>

            <label htmlFor="applicant-name">Ho ten</label>
            <input
              id="applicant-name"
              value={applyForm.applicantName}
              onChange={(event) =>
                setApplyForm((prev) => ({ ...prev, applicantName: event.target.value }))
              }
              placeholder="Nhap ho ten"
            />

            <label htmlFor="applicant-phone">So dien thoai</label>
            <input
              id="applicant-phone"
              value={applyForm.applicantPhone}
              onChange={(event) =>
                setApplyForm((prev) => ({ ...prev, applicantPhone: event.target.value }))
              }
              placeholder="Nhap so dien thoai"
            />

            <label htmlFor="applicant-email">Email</label>
            <input
              id="applicant-email"
              value={applyForm.applicantEmail}
              onChange={(event) =>
                setApplyForm((prev) => ({ ...prev, applicantEmail: event.target.value }))
              }
              placeholder="Nhap email"
            />

            <label htmlFor="applicant-note">Noi dung ho so</label>
            <textarea
              id="applicant-note"
              value={applyForm.note}
              onChange={(event) => setApplyForm((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Mo ta thong tin can giai quyet"
            />

            <button type="submit">Gui don</button>
            {applyMessage && <p className="helper-text">{applyMessage}</p>}
          </form>

          <form className="status-form" onSubmit={checkStatus}>
            <label htmlFor="hoso">Tra cuu trang thai ho so</label>
            <input
              id="hoso"
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              placeholder="Nhap ma ho so"
            />
            <button type="submit">Tra cuu</button>
            {applicationStatus && (
              <div className="status-result">
                {applicationStatus.message ??
                  `Trang thai: ${formatApplicationStatus(applicationStatus.status)}`}
              </div>
            )}
          </form>
        </div>
      </section>

      <section id="thu-vien" className="panel">
        <h3>Thu vien hinh anh va video</h3>
        <div className="chip-group">
          <button
            type="button"
            className={mediaFilter === 'All' ? 'chip is-active' : 'chip'}
            onClick={() => setMediaFilter('All')}
          >
            Tat ca
          </button>
          <button
            type="button"
            className={mediaFilter === 'Image' ? 'chip is-active' : 'chip'}
            onClick={() => setMediaFilter('Image')}
          >
            Hinh anh
          </button>
          <button
            type="button"
            className={mediaFilter === 'Video' ? 'chip is-active' : 'chip'}
            onClick={() => setMediaFilter('Video')}
          >
            Video
          </button>
        </div>
        <div className="gallery">
          {filteredMedia.map((item) => (
            <article key={item.id}>
              {item.type === 'Video' ? (
                <iframe src={item.url} title={item.title} allowFullScreen />
              ) : (
                <img src={item.url} alt={item.title} />
              )}
              <p>{item.title}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="lien-he" className="panel contact-grid">
        <div>
          <h3>Lien he UBND xa</h3>
          <p>Dia chi: Xa Tan Thuan Dong, TP Cao Lanh, Dong Thap</p>
          <p>Dien thoai: 0277 3 888 999</p>
          <p>Email: ubnd.tanthuanadong@dongthap.gov.vn</p>
        </div>
        <iframe
          title="Google map"
          src="https://www.google.com/maps?q=Cao%20Lanh%20Dong%20Thap&output=embed"
          loading="lazy"
        />
      </section>
    </div>
  )
}

function AdminPortal() {
  const [email, setEmail] = useState('admin@tanthuanadong.gov.vn')
  const [password, setPassword] = useState('Admin@123')
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [applications, setApplications] = useState([])
  const [users, setUsers] = useState([])
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [applicationFilter, setApplicationFilter] = useState('All')
  const [activeAdminTab, setActiveAdminTab] = useState('applications')
  const [statusDrafts, setStatusDrafts] = useState({})
  const [adminMessage, setAdminMessage] = useState('')
  const [articleForm, setArticleForm] = useState({
    categoryId: '',
    title: '',
    summary: '',
    content: '',
    thumbnailUrl: '',
    isPublished: true,
  })
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'Viewer',
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
  })
  const token = tokenStore.get()

  useEffect(() => {
    if (!token) {
      return
    }

    setError('')

    const load = async () => {
      const [dashRes, appRes, userRes, articleRes, categoryRes] = await Promise.allSettled([
        adminApi.getDashboard(),
        adminApi.getApplications(),
        adminApi.getUsers(),
        adminApi.getArticles(),
        adminApi.getCategories(),
      ])

      if (dashRes.status === 'fulfilled') {
        setDashboard(dashRes.value)
      }
      if (appRes.status === 'fulfilled') {
        setApplications(appRes.value)
      }
      if (userRes.status === 'fulfilled') {
        setUsers(userRes.value)
      }
      if (articleRes.status === 'fulfilled') {
        setArticles(articleRes.value)
      }
      if (categoryRes.status === 'fulfilled') {
        setCategories(categoryRes.value)
        if (categoryRes.value.length > 0) {
          setArticleForm((prev) => ({ ...prev, categoryId: String(categoryRes.value[0].id) }))
        }
      }

      if (dashRes.status === 'rejected' || appRes.status === 'rejected') {
        setError('Khong tai duoc du lieu dashboard')
      } else {
        setError('')
      }
    }

    load().catch(() => {
      setError('Khong tai duoc du lieu dashboard')
    })
  }, [token])

  const chartData = useMemo(() => {
    const labels = dashboard?.monthlyApplications?.map((item) => item.month) ?? []
    const values = dashboard?.monthlyApplications?.map((item) => item.value) ?? []

    return {
      labels,
      datasets: [
        {
          label: 'Ho so truc tuyen',
          data: values,
          backgroundColor: '#e67839',
          borderRadius: 8,
        },
      ],
    }
  }, [dashboard])

  const applicationStatuses = useMemo(() => {
    const statuses = applications.map((item) => formatApplicationStatus(item.status)).filter(Boolean)
    return ['All', ...new Set(statuses)]
  }, [applications])

  const filteredApplications = useMemo(() => {
    if (applicationFilter === 'All') {
      return applications
    }

    return applications.filter((item) => formatApplicationStatus(item.status) === applicationFilter)
  }, [applicationFilter, applications])

  const reloadAdminData = async () => {
    const [dashRes, appRes, userRes, articleRes, categoryRes] = await Promise.allSettled([
      adminApi.getDashboard(),
      adminApi.getApplications(),
      adminApi.getUsers(),
      adminApi.getArticles(),
      adminApi.getCategories(),
    ])

    if (dashRes.status === 'fulfilled') {
      setDashboard(dashRes.value)
    }
    if (appRes.status === 'fulfilled') {
      setApplications(appRes.value)
    }
    if (userRes.status === 'fulfilled') {
      setUsers(userRes.value)
    }
    if (articleRes.status === 'fulfilled') {
      setArticles(articleRes.value)
    }
    if (categoryRes.status === 'fulfilled') {
      setCategories(categoryRes.value)
      if (categoryRes.value.length > 0) {
        setArticleForm((prev) => ({
          ...prev,
          categoryId: prev.categoryId || String(categoryRes.value[0].id),
        }))
      }
    }

    if (dashRes.status === 'fulfilled' && appRes.status === 'fulfilled') {
      setError('')
    }
  }

  const login = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await authApi.login({ email, password })
      tokenStore.set(response.token)
      window.location.reload()
    } catch (error) {
      const message = error?.response?.data?.message
      setError(message || 'Dang nhap that bai')
    }
  }

  const logout = () => {
    tokenStore.clear()
    window.location.reload()
  }

  const updateApplicationStatus = async (applicationId) => {
    const status = statusDrafts[applicationId] ?? 1
    setAdminMessage('')
    try {
      await adminApi.updateApplicationStatus(applicationId, { status })
      await reloadAdminData()
      setAdminMessage('Da cap nhat trang thai ho so thanh cong.')
    } catch (updateError) {
      setAdminMessage(updateError?.response?.data?.message ?? 'Khong cap nhat duoc trang thai.')
    }
  }

  const submitArticle = async (event) => {
    event.preventDefault()
    setAdminMessage('')

    if (!articleForm.categoryId) {
      setAdminMessage('Vui long tao danh muc truoc khi dang bai.')
      return
    }

    try {
      await adminApi.createArticle({
        ...articleForm,
        categoryId: Number(articleForm.categoryId),
      })
      setArticleForm((prev) => ({
        ...prev,
        title: '',
        summary: '',
        content: '',
        thumbnailUrl: '',
      }))
      await reloadAdminData()
      setAdminMessage('Da dang bai viet thanh cong.')
    } catch (submitError) {
      setAdminMessage(submitError?.response?.data?.message ?? 'Khong dang duoc bai viet.')
    }
  }

  const submitCategory = async (event) => {
    event.preventDefault()
    setAdminMessage('')

    if (!categoryForm.name.trim()) {
      setAdminMessage('Ten danh muc la bat buoc.')
      return
    }

    try {
      const created = await adminApi.createCategory(categoryForm)
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
      })
      await reloadAdminData()
      setArticleForm((prev) => ({ ...prev, categoryId: String(created.id) }))
      setAdminMessage('Da tao danh muc moi.')
    } catch (submitError) {
      setAdminMessage(submitError?.response?.data?.message ?? 'Khong tao duoc danh muc.')
    }
  }

  const toggleArticlePublish = async (id, isPublished) => {
    setAdminMessage('')
    try {
      await adminApi.updateArticlePublish(id, { isPublished: !isPublished })
      await reloadAdminData()
      setAdminMessage('Da cap nhat trang thai bai viet.')
    } catch (toggleError) {
      setAdminMessage(toggleError?.response?.data?.message ?? 'Khong cap nhat duoc bai viet.')
    }
  }

  const submitUser = async (event) => {
    event.preventDefault()
    setAdminMessage('')
    try {
      await adminApi.createUser(userForm)
      setUserForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'Viewer',
      })
      await reloadAdminData()
      setAdminMessage('Da tao nguoi dung moi.')
    } catch (submitError) {
      const errors = submitError?.response?.data?.errors
      if (Array.isArray(errors)) {
        setAdminMessage(errors.join(' | '))
      } else {
        setAdminMessage(submitError?.response?.data?.message ?? 'Khong tao duoc nguoi dung.')
      }
    }
  }

  const toggleUserActive = async (userId, isActive) => {
    setAdminMessage('')
    try {
      await adminApi.updateUserActive(userId, { isActive: !isActive })
      await reloadAdminData()
      setAdminMessage('Da cap nhat trang thai tai khoan.')
    } catch (toggleError) {
      setAdminMessage(toggleError?.response?.data?.message ?? 'Khong cap nhat duoc tai khoan.')
    }
  }

  if (!token) {
    return (
      <main className="admin-auth">
        <form className="login-box" onSubmit={login}>
          <h2>Dang nhap quan tri</h2>
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Dang nhap</button>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Trang quan tri</p>
          <h1>Admin Dashboard - Xa Tan Thuan Dong</h1>
          <p>Theo doi ho so, tinh trang dich vu va du lieu hoat dong theo thoi gian thuc.</p>
        </div>
        <div className="admin-header-actions">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80"
            alt="Khong gian lam viec quan tri"
            loading="lazy"
          />
          <button onClick={logout}>Dang xuat</button>
        </div>
      </header>

      <section className="admin-cards">
        <article>
          <strong>{dashboard?.totalUsers ?? 0}</strong>
          <span>Nguoi dung</span>
        </article>
        <article>
          <strong>{dashboard?.totalArticles ?? 0}</strong>
          <span>Bai viet</span>
        </article>
        <article>
          <strong>{dashboard?.totalServices ?? 0}</strong>
          <span>Thu tuc</span>
        </article>
        <article>
          <strong>{dashboard?.totalApplications ?? 0}</strong>
          <span>Ho so</span>
        </article>
      </section>

      <section className="admin-chart">
        <h3>Thong ke ho so 6 thang</h3>
        <Bar data={chartData} />
      </section>

      <section className="panel admin-tabs">
        <button
          type="button"
          className={activeAdminTab === 'applications' ? 'chip is-active' : 'chip'}
          onClick={() => setActiveAdminTab('applications')}
        >
          Quan ly ho so
        </button>
        <button
          type="button"
          className={activeAdminTab === 'articles' ? 'chip is-active' : 'chip'}
          onClick={() => setActiveAdminTab('articles')}
        >
          Quan ly bai viet
        </button>
        <button
          type="button"
          className={activeAdminTab === 'users' ? 'chip is-active' : 'chip'}
          onClick={() => setActiveAdminTab('users')}
        >
          Quan ly nguoi dung
        </button>
      </section>

      {adminMessage && <p className="helper-text">{adminMessage}</p>}

      {activeAdminTab === 'applications' && (
      <section className="admin-table">
        <h3>Danh sach ho so</h3>
        <div className="chip-group">
          {applicationStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className={applicationFilter === status ? 'chip is-active' : 'chip'}
              onClick={() => setApplicationFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
        {error && <p className="error-text">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nguoi nop</th>
              <th>Dich vu</th>
              <th>Trang thai</th>
              <th>Cap nhat</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.applicantName}</td>
                <td>{item.serviceName}</td>
                <td>{formatApplicationStatus(item.status)}</td>
                <td>
                  <div className="inline-actions">
                    <select
                      value={statusDrafts[item.id] ?? statusCodeFromValue(item.status)}
                      onChange={(event) =>
                        setStatusDrafts((prev) => ({
                          ...prev,
                          [item.id]: Number(event.target.value),
                        }))
                      }
                    >
                      {APPLICATION_STATUS_OPTIONS.map((statusOption) => (
                        <option key={statusOption.value} value={statusOption.value}>
                          {statusOption.label}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => updateApplicationStatus(item.id)}>
                      Luu
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      )}

      {activeAdminTab === 'articles' && (
        <section className="admin-table">
          <h3>Danh muc bai viet</h3>
          <form className="admin-form admin-form-grid" onSubmit={submitCategory}>
            <input
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Ten danh muc"
            />
            <input
              value={categoryForm.slug}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))
              }
              placeholder="Slug (tu dong neu bo trong)"
            />
            <input
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Mo ta ngan"
            />
            <button type="submit">Them danh muc</button>
          </form>

          <h3>Dang bai viet moi</h3>
          <form className="admin-form" onSubmit={submitArticle}>
            <select
              value={articleForm.categoryId}
              onChange={(event) =>
                setArticleForm((prev) => ({ ...prev, categoryId: event.target.value }))
              }
            >
              {categories.length === 0 && <option value="">Chua co danh muc</option>}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              value={articleForm.title}
              onChange={(event) => setArticleForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Tieu de bai viet"
            />
            <input
              value={articleForm.thumbnailUrl}
              onChange={(event) =>
                setArticleForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
              }
              placeholder="Link hinh dai dien"
            />
            <textarea
              value={articleForm.summary}
              onChange={(event) => setArticleForm((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Tom tat"
            />
            <textarea
              value={articleForm.content}
              onChange={(event) => setArticleForm((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Noi dung bai viet"
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={articleForm.isPublished}
                onChange={(event) =>
                  setArticleForm((prev) => ({ ...prev, isPublished: event.target.checked }))
                }
              />
              Dang cong khai
            </label>
            <button type="submit" disabled={categories.length === 0}>
              Dang bai
            </button>
          </form>

          <h3>Danh sach bai viet</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tieu de</th>
                <th>Danh muc</th>
                <th>Trang thai</th>
                <th>Hanh dong</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td>{item.categoryName}</td>
                  <td>{item.isPublished ? 'Da dang' : 'Ban nhap'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleArticlePublish(item.id, item.isPublished)}
                    >
                      {item.isPublished ? 'An bai' : 'Dang lai'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeAdminTab === 'users' && (
        <section className="admin-table">
          <h3>Tao nguoi dung moi</h3>
          <form className="admin-form admin-form-grid" onSubmit={submitUser}>
            <input
              value={userForm.fullName}
              onChange={(event) => setUserForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Ho ten"
            />
            <input
              value={userForm.email}
              onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
            />
            <input
              value={userForm.phoneNumber}
              onChange={(event) =>
                setUserForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
              }
              placeholder="So dien thoai"
            />
            <input
              type="password"
              value={userForm.password}
              onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Mat khau"
            />
            <select
              value={userForm.role}
              onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button type="submit">Tao tai khoan</button>
          </form>

          <h3>Danh sach nguoi dung</h3>
          <table>
            <thead>
              <tr>
                <th>Ho ten</th>
                <th>Email</th>
                <th>Vai tro</th>
                <th>Trang thai</th>
                <th>Hanh dong</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{Array.isArray(user.roles) ? user.roles.join(', ') : ''}</td>
                  <td>{user.isActive ? 'Dang hoat dong' : 'Da khoa'}</td>
                  <td>
                    <button type="button" onClick={() => toggleUserActive(user.id, user.isActive)}>
                      {user.isActive ? 'Khoa tai khoan' : 'Mo khoa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<GatewayPage />} />
      <Route path="/portal" element={<UserPortal />} />
      <Route path="/admin" element={<AdminPortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
