import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
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
  1: 'Chờ duyệt',
  2: 'Đã tiếp nhận',
  3: 'Đang xử lý',
  4: 'Đã duyệt',
  5: 'Không duyệt',
}

const APPLICATION_STATUS_CODE_BY_NAME = {
  New: 1,
  Received: 2,
  Processing: 3,
  Completed: 4,
  Rejected: 5,
}

const APPLICATION_STATUS_OPTIONS = [
  { value: 1, label: 'Chờ duyệt' },
  { value: 3, label: 'Đang xử lý' },
  { value: 4, label: 'Đã duyệt' },
  { value: 5, label: 'Không duyệt' },
]

const PORTAL_NAV_ITEMS = [
  { key: 'home', to: '/portal', label: 'Trang chủ' },
  { key: 'intro', to: '/portal/gioi-thieu', label: 'Giới thiệu' },
  { key: 'news', to: '/portal/tin-tuc', label: 'Tin tức' },
  { key: 'services', to: '/portal/dich-vu-hanh-chinh', label: 'Dịch vụ hành chính' },
  { key: 'library', to: '/portal/thu-vien', label: 'Thư viện' },
  { key: 'contact', to: '/portal/lien-he', label: 'Liên hệ' },
]

const PORTAL_PAGE_TITLES = {
  home: 'Trang chủ',
  intro: 'Giới thiệu',
  news: 'Tin tức',
  services: 'Dịch vụ hành chính',
  library: 'Thư viện',
  contact: 'Liên hệ',
}

function formatApplicationStatus(value) {
  if (typeof value === 'number') {
    return APPLICATION_STATUS_MAP[value] ?? `Khác (${value})`
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

  return 'Chưa cập nhật'
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
        <p className="eyebrow">Cao Lãnh - Đồng Tháp</p>
        <h1>Cổng Thông Tin Xã Tân Thuận Đông</h1>
        <p>
          Nền tảng quảng bá thông tin địa phương, dịch vụ hành chính và kênh
          tương tác công dân.
        </p>
        <div className="gateway-actions">
          <a href="/portal" target="_blank" rel="noreferrer" className="btn-primary">
            Mở tab người dùng
          </a>
          <a href="/admin" target="_blank" rel="noreferrer" className="btn-outline">
            Mở tab quản trị
          </a>
        </div>
      </section>
    </main>
  )
}

function UserPortal({ activeSection }) {
  const [home, setHome] = useState(null)
  const [news, setNews] = useState([])
  const [services, setServices] = useState([])
  const [media, setMedia] = useState([])
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [applicationId, setApplicationId] = useState('')
  const [newsFilter, setNewsFilter] = useState('All')
  const [mediaFilter, setMediaFilter] = useState('All')
  const [applyMessage, setApplyMessage] = useState('')
  const [clockText, setClockText] = useState('')
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

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClockText(
        now.toLocaleString('vi-VN', {
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      )
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal')
    if (!revealItems.length) {
      return undefined
    }

    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('in-view'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.18 },
    )

    revealItems.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [news, services, media, activeSection])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeSection])

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
      setApplicationStatus({ message: 'Không tìm thấy hồ sơ' })
    }
  }

  const applyService = async (event) => {
    event.preventDefault()
    setApplyMessage('')

    if (!applyForm.serviceProcedureId || !applyForm.applicantName || !applyForm.applicantPhone) {
      setApplyMessage('Vui lòng nhập đầy đủ thông tin bắt buộc.')
      return
    }

    try {
      const payload = {
        ...applyForm,
        serviceProcedureId: Number(applyForm.serviceProcedureId),
      }
      const result = await publicApi.applyService(payload)
      setApplyMessage(`${result.message} Mã hồ sơ của bạn: ${result.applicationId}`)
      setApplicationId(String(result.applicationId))
      setApplyForm((prev) => ({
        ...prev,
        applicantName: '',
        applicantPhone: '',
        applicantEmail: '',
        note: '',
      }))
    } catch (error) {
      setApplyMessage(error?.response?.data?.message ?? 'Không gửi được hồ sơ. Vui lòng thử lại.')
    }
  }

  const renderPortalPage = () => {
    if (activeSection === 'intro') {
      return (
        <section className="panel reveal">
          <div className="intro-layout">
            <div>
              <h3>Giới thiệu địa phương</h3>
              <p>
                Tân Thuận Đông có vị trí thuận lợi kết nối trung tâm thành phố Cao Lãnh,
                phát triển nông nghiệp công nghệ cao và dịch vụ thương mại nông thôn.
              </p>
            </div>
            <figure>
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80"
                alt="Mô hình canh tác hiện đại"
                loading="lazy"
              />
            </figure>
          </div>
        </section>
      )
    }

    if (activeSection === 'news') {
      return (
        <section className="panel reveal">
          <h3>Tin tức nổi bật</h3>
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
      )
    }

    if (activeSection === 'services') {
      return (
        <section className="panel reveal">
          <h3>Dịch vụ hành chính</h3>
          <div className="service-table">
            {services.map((service) => (
              <article key={service.id}>
                <h4>
                  {service.code} - {service.name}
                </h4>
                <p>{service.description}</p>
                <p>
                  Biểu mẫu: <a href={service.formUrl}>Tải xuống</a>
                </p>
              </article>
            ))}
          </div>

          <div className="service-actions-grid">
            <form className="application-form" onSubmit={applyService}>
              <h4>Gửi đơn trực tiếp trên web</h4>
              <label htmlFor="service-id">Thủ tục</label>
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

              <label htmlFor="applicant-name">Họ tên</label>
              <input
                id="applicant-name"
                value={applyForm.applicantName}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, applicantName: event.target.value }))
                }
                placeholder="Nhập họ tên"
              />

              <label htmlFor="applicant-phone">Số điện thoại</label>
              <input
                id="applicant-phone"
                value={applyForm.applicantPhone}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, applicantPhone: event.target.value }))
                }
                placeholder="Nhập số điện thoại"
              />

              <label htmlFor="applicant-email">Email</label>
              <input
                id="applicant-email"
                value={applyForm.applicantEmail}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, applicantEmail: event.target.value }))
                }
                placeholder="Nhập email"
              />

              <label htmlFor="applicant-note">Nội dung hồ sơ</label>
              <textarea
                id="applicant-note"
                value={applyForm.note}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, note: event.target.value }))
                }
                placeholder="Mô tả thông tin cần giải quyết"
              />

              <button type="submit">Gửi đơn</button>
              {applyMessage && <p className="helper-text">{applyMessage}</p>}
            </form>

            <form className="status-form" onSubmit={checkStatus}>
              <label htmlFor="hoso">Tra cứu trạng thái hồ sơ</label>
              <input
                id="hoso"
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="Nhập mã hồ sơ"
              />
              <button type="submit">Tra cứu</button>
              {applicationStatus && (
                <div className="status-result">
                  {applicationStatus.message ??
                    `Trạng thái: ${formatApplicationStatus(applicationStatus.status)}`}
                </div>
              )}
            </form>
          </div>
        </section>
      )
    }

    if (activeSection === 'library') {
      return (
        <section className="panel reveal">
          <h3>Thư viện hình ảnh và video</h3>
          <div className="chip-group">
            <button
              type="button"
              className={mediaFilter === 'All' ? 'chip is-active' : 'chip'}
              onClick={() => setMediaFilter('All')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={mediaFilter === 'Image' ? 'chip is-active' : 'chip'}
              onClick={() => setMediaFilter('Image')}
            >
              Hình ảnh
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
      )
    }

    if (activeSection === 'contact') {
      return (
        <section className="panel contact-grid reveal">
          <div>
            <h3>Liên hệ UBND xã</h3>
            <p>Địa chỉ: Xã Tân Thuận Đông, TP Cao Lãnh, Đồng Tháp</p>
            <p>Điện thoại: 0277 3 888 999</p>
            <p>Email: ubnd.tanthuanadong@dongthap.gov.vn</p>
          </div>
          <iframe
            title="Google Maps"
            src="https://www.google.com/maps?q=Cao%20Lanh%20Dong%20Thap&output=embed"
            loading="lazy"
          />
        </section>
      )
    }

    return (
      <>
        <section className="hero-section reveal">
          <div className="hero-copy">
            <p className="eyebrow">Trang người dùng</p>
            <h1>{home?.bannerTitle ?? 'Đang tải dữ liệu...'}</h1>
            <p>{home?.commune ?? 'Thông tin tổng quan xã Tân Thuận Đông.'}</p>
            <div className="hero-actions">
              <Link to="/portal/tin-tuc" className="btn-primary">
                Xem tin nổi bật
              </Link>
              <Link to="/portal/dich-vu-hanh-chinh" className="btn-outline">
                Thủ tục nhanh
              </Link>
            </div>
          </div>
          <div className="hero-side">
            <figure className="hero-media">
              <img
                src="https://images.unsplash.com/photo-1472653525502-f9c3c7f4f2c8?auto=format&fit=crop&w=1200&q=80"
                alt="Cảnh quan nông nghiệp tại Đồng Tháp"
                loading="lazy"
              />
            </figure>
            <div className="stats">
              <article>
                <strong>{home?.statistics?.Population ?? '--'}</strong>
                <span>Dân số</span>
              </article>
              <article>
                <strong>{home?.statistics?.AreaKm2 ?? '--'}</strong>
                <span>Diện tích km2</span>
              </article>
              <article>
                <strong>{home?.statistics?.OnlineApplications ?? '--'}</strong>
                <span>Hồ sơ trực tuyến</span>
              </article>
              <article>
                <strong>{home?.statistics?.ActiveServices ?? '--'}</strong>
                <span>Dịch vụ đang mở</span>
              </article>
            </div>
          </div>
        </section>

        <section className="panel quick-actions reveal">
          <Link to="/portal/dich-vu-hanh-chinh">
            <h4>Nộp hồ sơ trực tuyến</h4>
            <p>Thực hiện thủ tục hành chính ngay trên cổng thông tin.</p>
          </Link>
          <Link to="/portal/dich-vu-hanh-chinh">
            <h4>Tra cứu tiến độ</h4>
            <p>Theo dõi kết quả xử lý qua mã hồ sơ nhanh chóng.</p>
          </Link>
          <Link to="/portal/tin-tuc">
            <h4>Lịch tiếp công dân</h4>
            <p>Cập nhật lịch làm việc, lịch họp và thông báo mới nhất.</p>
          </Link>
          <Link to="/portal/lien-he">
            <h4>Kênh phản ánh kiến nghị</h4>
            <p>Gửi ý kiến trực tiếp đến bộ phận tiếp nhận của xã.</p>
          </Link>
        </section>

        <section className="panel reveal">
          <div className="intro-layout">
            <div>
              <h3>Giới thiệu địa phương</h3>
              <p>
                Tân Thuận Đông có vị trí thuận lợi kết nối trung tâm thành phố Cao Lãnh,
                phát triển nông nghiệp công nghệ cao và dịch vụ thương mại nông thôn.
              </p>
            </div>
            <figure>
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80"
                alt="Mô hình canh tác hiện đại"
                loading="lazy"
              />
            </figure>
          </div>
        </section>

        <section className="panel reveal">
          <h3>Tin tức nổi bật</h3>
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

        <section className="panel reveal">
          <h3>Dịch vụ hành chính</h3>
          <div className="service-table">
            {services.map((service) => (
              <article key={service.id}>
                <h4>
                  {service.code} - {service.name}
                </h4>
                <p>{service.description}</p>
                <p>
                  Biểu mẫu: <a href={service.formUrl}>Tải xuống</a>
                </p>
              </article>
            ))}
          </div>

          <div className="service-actions-grid">
            <form className="application-form" onSubmit={applyService}>
              <h4>Gửi đơn trực tiếp trên web</h4>
              <label htmlFor="service-id-home">Thủ tục</label>
              <select
                id="service-id-home"
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

              <label htmlFor="applicant-name-home">Họ tên</label>
              <input
                id="applicant-name-home"
                value={applyForm.applicantName}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, applicantName: event.target.value }))
                }
                placeholder="Nhập họ tên"
              />

              <label htmlFor="applicant-phone-home">Số điện thoại</label>
              <input
                id="applicant-phone-home"
                value={applyForm.applicantPhone}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, applicantPhone: event.target.value }))
                }
                placeholder="Nhập số điện thoại"
              />

              <label htmlFor="applicant-email-home">Email</label>
              <input
                id="applicant-email-home"
                value={applyForm.applicantEmail}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, applicantEmail: event.target.value }))
                }
                placeholder="Nhập email"
              />

              <label htmlFor="applicant-note-home">Nội dung hồ sơ</label>
              <textarea
                id="applicant-note-home"
                value={applyForm.note}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, note: event.target.value }))
                }
                placeholder="Mô tả thông tin cần giải quyết"
              />

              <button type="submit">Gửi đơn</button>
              {applyMessage && <p className="helper-text">{applyMessage}</p>}
            </form>

            <form className="status-form" onSubmit={checkStatus}>
              <label htmlFor="hoso-home">Tra cứu trạng thái hồ sơ</label>
              <input
                id="hoso-home"
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="Nhập mã hồ sơ"
              />
              <button type="submit">Tra cứu</button>
              {applicationStatus && (
                <div className="status-result">
                  {applicationStatus.message ??
                    `Trạng thái: ${formatApplicationStatus(applicationStatus.status)}`}
                </div>
              )}
            </form>
          </div>
        </section>

        <section className="panel reveal">
          <h3>Thư viện hình ảnh và video</h3>
          <div className="chip-group">
            <button
              type="button"
              className={mediaFilter === 'All' ? 'chip is-active' : 'chip'}
              onClick={() => setMediaFilter('All')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={mediaFilter === 'Image' ? 'chip is-active' : 'chip'}
              onClick={() => setMediaFilter('Image')}
            >
              Hình ảnh
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

        <section className="panel contact-grid reveal">
          <div>
            <h3>Liên hệ UBND xã</h3>
            <p>Địa chỉ: Xã Tân Thuận Đông, TP Cao Lãnh, Đồng Tháp</p>
            <p>Điện thoại: 0277 3 888 999</p>
            <p>Email: ubnd.tanthuanadong@dongthap.gov.vn</p>
          </div>
          <iframe
            title="Google Maps"
            src="https://www.google.com/maps?q=Cao%20Lanh%20Dong%20Thap&output=embed"
            loading="lazy"
          />
        </section>
      </>
    )
  }

  return (
    <div id="trang-chu" className="portal-shell">
      <section className="civic-banner reveal">
        <div className="civic-banner-copy">
          <p className="eyebrow">TRANG THÔNG TIN ĐIỆN TỬ</p>
          <h1>PHƯỜNG/XÃ TÂN THUẬN ĐÔNG</h1>
          <p>
            Giữ vững đoàn kết - Phát huy nội lực - Nâng cao năng lực lãnh đạo -
            Xây dựng địa phương văn minh, hiện đại, đáng sống.
          </p>
        </div>
        <div className="civic-banner-media">
          <img
            src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80"
            alt="Toàn cảnh cầu và đô thị ven sông"
            loading="lazy"
          />
        </div>
      </section>

      <div className="gov-strip reveal">
        <span>UBND XÃ TÂN THUẬN ĐÔNG - CỔNG THÔNG TIN ĐIỆN TỬ</span>
        <span>Đường dây nóng: 0277 3 888 999</span>
        <span>{clockText || 'Đang cập nhật thời gian...'}</span>
      </div>

      <header className="topbar portal-topbar reveal">
        <div className="brand-block">
          <div className="crest">UB</div>
          <div>
            <h2>Cổng thông tin xã Tân Thuận Đông</h2>
            <p>Nền hành chính phục vụ người dân và doanh nghiệp</p>
          </div>
        </div>
        <nav>
          {PORTAL_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.to === '/portal'}
              className={({ isActive }) => (isActive ? 'is-active-link' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <section className="portal-breadcrumb reveal" aria-label="Điều hướng trang">
        <span>Trang chủ</span>
        <strong>{PORTAL_PAGE_TITLES[activeSection] ?? 'Trang chủ'}</strong>
      </section>

      <section className="notice-bar reveal" aria-label="Thông báo mới">
        <p>
          <strong>Thông báo:</strong> Chuyển đổi số cấp xã đang được đẩy mạnh. Người dân ưu tiên nộp
          hồ sơ trực tuyến và theo dõi tiến độ qua mã hồ sơ.
        </p>
      </section>

      {renderPortalPage()}
    </div>
  )
}

function AdminPortal() {
  const [email, setEmail] = useState('admin@tanthuanadong.gov.vn')
  const [password, setPassword] = useState('Admin@123')
  const [adminNow, setAdminNow] = useState('')
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
    const tick = () => {
      const now = new Date()
      setAdminNow(
        now.toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      )
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [])

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
        setError('Không tải được dữ liệu dashboard')
      } else {
        setError('')
      }
    }

    load().catch(() => {
      setError('Không tải được dữ liệu dashboard')
    })
  }, [token])

  const chartData = useMemo(() => {
    const labels = dashboard?.monthlyApplications?.map((item) => item.month) ?? []
    const values = dashboard?.monthlyApplications?.map((item) => item.value) ?? []

    return {
      labels,
      datasets: [
        {
          label: 'Hồ sơ trực tuyến',
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
      setError(message || 'Đăng nhập thất bại')
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
      setAdminMessage('Đã cập nhật trạng thái hồ sơ thành công.')
    } catch (updateError) {
      setAdminMessage(updateError?.response?.data?.message ?? 'Không cập nhật được trạng thái.')
    }
  }

  const submitArticle = async (event) => {
    event.preventDefault()
    setAdminMessage('')

    if (!articleForm.categoryId) {
      setAdminMessage('Vui lòng tạo danh mục trước khi đăng bài.')
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
      setAdminMessage('Đã đăng bài viết thành công.')
    } catch (submitError) {
      setAdminMessage(submitError?.response?.data?.message ?? 'Không đăng được bài viết.')
    }
  }

  const submitCategory = async (event) => {
    event.preventDefault()
    setAdminMessage('')

    if (!categoryForm.name.trim()) {
      setAdminMessage('Tên danh mục là bắt buộc.')
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
      setAdminMessage('Đã tạo danh mục mới.')
    } catch (submitError) {
      setAdminMessage(submitError?.response?.data?.message ?? 'Không tạo được danh mục.')
    }
  }

  const toggleArticlePublish = async (id, isPublished) => {
    setAdminMessage('')
    try {
      await adminApi.updateArticlePublish(id, { isPublished: !isPublished })
      await reloadAdminData()
      setAdminMessage('Đã cập nhật trạng thái bài viết.')
    } catch (toggleError) {
      setAdminMessage(toggleError?.response?.data?.message ?? 'Không cập nhật được bài viết.')
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
      setAdminMessage('Đã tạo người dùng mới.')
    } catch (submitError) {
      const errors = submitError?.response?.data?.errors
      if (Array.isArray(errors)) {
        setAdminMessage(errors.join(' | '))
      } else {
        setAdminMessage(submitError?.response?.data?.message ?? 'Không tạo được người dùng.')
      }
    }
  }

  const toggleUserActive = async (userId, isActive) => {
    setAdminMessage('')
    try {
      await adminApi.updateUserActive(userId, { isActive: !isActive })
      await reloadAdminData()
      setAdminMessage('Đã cập nhật trạng thái tài khoản.')
    } catch (toggleError) {
      setAdminMessage(toggleError?.response?.data?.message ?? 'Không cập nhật được tài khoản.')
    }
  }

  if (!token) {
    return (
      <main className="admin-auth">
        <form className="login-box" onSubmit={login}>
          <h2>Đăng nhập quản trị</h2>
          <p className="login-subtitle">Hệ thống quản lý nội dung và dịch vụ công trực tuyến</p>
          <label htmlFor="admin-email">Email quản trị</label>
          <input
            id="admin-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Nhập email quản trị"
          />
          <label htmlFor="admin-password">Mật khẩu</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu"
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Đăng nhập</button>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <section className="admin-meta-strip">
        <span>Phiên đăng nhập: Admin</span>
        <span>Trạng thái hệ thống: Hoạt động ổn định</span>
        <span>{adminNow || 'Đang cập nhật thời gian...'}</span>
      </section>

      <header className="admin-header">
        <div>
          <p className="eyebrow">Trang quản trị</p>
          <h1>Admin Dashboard - Xã Tân Thuận Đông</h1>
          <p>Theo dõi hồ sơ, tình trạng dịch vụ và dữ liệu hoạt động theo thời gian thực.</p>
        </div>
        <div className="admin-header-actions">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80"
            alt="Không gian làm việc quản trị"
            loading="lazy"
          />
          <button onClick={logout}>Đăng xuất</button>
        </div>
      </header>

      <section className="admin-cards admin-block">
        <article>
          <strong>{dashboard?.totalUsers ?? 0}</strong>
          <span>Người dùng</span>
        </article>
        <article>
          <strong>{dashboard?.totalArticles ?? 0}</strong>
          <span>Bài viết</span>
        </article>
        <article>
          <strong>{dashboard?.totalServices ?? 0}</strong>
          <span>Thủ tục</span>
        </article>
        <article>
          <strong>{dashboard?.totalApplications ?? 0}</strong>
          <span>Hồ sơ</span>
        </article>
      </section>

      <section className="admin-chart admin-block">
        <h3>Thống kê hồ sơ 6 tháng</h3>
        <Bar data={chartData} />
      </section>

      <section className="panel admin-tabs admin-block">
        <button
          type="button"
          className={activeAdminTab === 'applications' ? 'chip is-active' : 'chip'}
          onClick={() => setActiveAdminTab('applications')}
        >
          Quản lý hồ sơ
        </button>
        <button
          type="button"
          className={activeAdminTab === 'articles' ? 'chip is-active' : 'chip'}
          onClick={() => setActiveAdminTab('articles')}
        >
          Quản lý bài viết
        </button>
        <button
          type="button"
          className={activeAdminTab === 'users' ? 'chip is-active' : 'chip'}
          onClick={() => setActiveAdminTab('users')}
        >
          Quản lý người dùng
        </button>
      </section>

      {adminMessage && <p className="helper-text">{adminMessage}</p>}

      {activeAdminTab === 'applications' && (
      <section className="admin-table admin-block">
        <h3>Danh sách hồ sơ</h3>
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
              <th>Người nộp</th>
              <th>Dịch vụ</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
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
                      Lưu
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
        <section className="admin-table admin-block">
          <h3>Danh mục bài viết</h3>
          <form className="admin-form admin-form-grid" onSubmit={submitCategory}>
            <input
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Tên danh mục"
            />
            <input
              value={categoryForm.slug}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))
              }
              placeholder="Slug (tự động nếu bỏ trống)"
            />
            <input
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Mô tả ngắn"
            />
            <button type="submit">Thêm danh mục</button>
          </form>

          <h3>Đăng bài viết mới</h3>
          <form className="admin-form" onSubmit={submitArticle}>
            <select
              value={articleForm.categoryId}
              onChange={(event) =>
                setArticleForm((prev) => ({ ...prev, categoryId: event.target.value }))
              }
            >
              {categories.length === 0 && <option value="">Chưa có danh mục</option>}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              value={articleForm.title}
              onChange={(event) => setArticleForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Tiêu đề bài viết"
            />
            <input
              value={articleForm.thumbnailUrl}
              onChange={(event) =>
                setArticleForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
              }
              placeholder="Link hình đại diện"
            />
            <textarea
              value={articleForm.summary}
              onChange={(event) => setArticleForm((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Tóm tắt"
            />
            <textarea
              value={articleForm.content}
              onChange={(event) => setArticleForm((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Nội dung bài viết"
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={articleForm.isPublished}
                onChange={(event) =>
                  setArticleForm((prev) => ({ ...prev, isPublished: event.target.checked }))
                }
              />
              Đăng công khai
            </label>
            <button type="submit" disabled={categories.length === 0}>
              Đăng bài
            </button>
          </form>

          <h3>Danh sách bài viết</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tiêu đề</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td>{item.categoryName}</td>
                  <td>{item.isPublished ? 'Đã đăng' : 'Bản nháp'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleArticlePublish(item.id, item.isPublished)}
                    >
                      {item.isPublished ? 'Ẩn bài' : 'Đăng lại'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeAdminTab === 'users' && (
        <section className="admin-table admin-block">
          <h3>Tạo người dùng mới</h3>
          <form className="admin-form admin-form-grid" onSubmit={submitUser}>
            <input
              value={userForm.fullName}
              onChange={(event) => setUserForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Họ tên"
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
              placeholder="Số điện thoại"
            />
            <input
              type="password"
              value={userForm.password}
              onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Mật khẩu"
            />
            <select
              value={userForm.role}
              onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button type="submit">Tạo tài khoản</button>
          </form>

          <h3>Danh sách người dùng</h3>
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{Array.isArray(user.roles) ? user.roles.join(', ') : ''}</td>
                  <td>{user.isActive ? 'Đang hoạt động' : 'Đã khóa'}</td>
                  <td>
                    <button type="button" onClick={() => toggleUserActive(user.id, user.isActive)}>
                      {user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
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
      <Route path="/portal" element={<UserPortal activeSection="home" />} />
      <Route path="/portal/gioi-thieu" element={<UserPortal activeSection="intro" />} />
      <Route path="/portal/tin-tuc" element={<UserPortal activeSection="news" />} />
      <Route
        path="/portal/dich-vu-hanh-chinh"
        element={<UserPortal activeSection="services" />}
      />
      <Route path="/portal/thu-vien" element={<UserPortal activeSection="library" />} />
      <Route path="/portal/lien-he" element={<UserPortal activeSection="contact" />} />
      <Route path="/admin" element={<AdminPortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
