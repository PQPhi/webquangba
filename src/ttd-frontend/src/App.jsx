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
        <form className="status-form" onSubmit={checkStatus}>
          <label htmlFor="hoso">Tra cuu trang thai ho so</label>
          <input
            id="hoso"
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
            placeholder="Nhap ma ho so"
          />
          <button type="submit">Tra cuu</button>
        </form>
        {applicationStatus && (
          <div className="status-result">
            {applicationStatus.message ?? `Trang thai: ${applicationStatus.status}`}
          </div>
        )}
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
  const [applicationFilter, setApplicationFilter] = useState('All')
  const token = tokenStore.get()

  useEffect(() => {
    if (!token) {
      return
    }

    const load = async () => {
      const [dashRes, appRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getApplications(),
      ])
      setDashboard(dashRes)
      setApplications(appRes)
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
    const statuses = applications.map((item) => item.status).filter(Boolean)
    return ['All', ...new Set(statuses)]
  }, [applications])

  const filteredApplications = useMemo(() => {
    if (applicationFilter === 'All') {
      return applications
    }

    return applications.filter((item) => item.status === applicationFilter)
  }, [applicationFilter, applications])

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
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.applicantName}</td>
                <td>{item.serviceName}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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
