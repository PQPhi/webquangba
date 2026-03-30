# Web Quang Ba Xa Tan Thuan Dong

Do an lon hoc ky 2 nam hoc 2025-2026: website quang ba phuong xa, tich hop Frontend va Backend.

## 1) Cong nghe su dung

- Frontend: React + Vite, Axios, React Router, Chart.js
- Backend: ASP.NET Core 8 Web API, Entity Framework Core, ASP.NET Identity, JWT
- Database: SQL Server LocalDB (co the doi chuoi ket noi sang SQL Server/PostgreSQL theo moi truong)

## 2) Chuc nang da trien khai

### 2.1 Nguoi dung (Public Portal)

- Trang chu: banner, thong ke co ban, tin noi bat
- Gioi thieu dia phuong
- Tin tuc: danh sach bai viet
- Dich vu hanh chinh: danh sach thu tuc + tra cuu trang thai ho so
- Thu vien: hinh anh va video
- Lien he: thong tin UBND + Google Maps

### 2.2 Quan tri (Admin Portal)

- Dang nhap JWT
- Dashboard thong ke tong hop + bieu do (Chart.js)
- Xem danh sach ho so
- API quan tri co san cho: users, comments, applications, dashboard

## 3) Yeu cau dac biet: tach tab nguoi dung va tab quan tri

- Trang cong vao: `/`
- Nut "Mo tab nguoi dung" mo portal tai `/portal` bang tab moi
- Nut "Mo tab quan tri" mo portal tai `/admin` bang tab moi

=> Nguoi dung va quan tri duoc tach rieng thanh 2 tab trinh duyet khac nhau.

## 4) Cau truc thu muc

```text
src/
	TanThuanDong.Api/            # ASP.NET Core API
	TanThuanDong.Domain/         # Entity + constants
	TanThuanDong.Application/    # DTO + contracts
	TanThuanDong.Infrastructure/ # DbContext + seed data
	ttd-frontend/                # React frontend
```

## 5) Cach chay du an

### 5.1 Chay Backend

```powershell
cd src/TanThuanDong.Api
dotnet run
```

Backend mac dinh: `https://localhost:7001`

Swagger: `https://localhost:7001/swagger`

### 5.2 Chay Frontend

```powershell
cd src/ttd-frontend
npm install
npm run dev
```

Frontend mac dinh: `http://localhost:5173`

## 6) Tai khoan quan tri mac dinh

- Email: `admin@tanthuanadong.gov.vn`
- Password: `Admin@123`

## 7) Luu y bao mat

- Da dung JWT + phan quyen role Admin/Editor/Viewer
- Mat khau duoc hash boi ASP.NET Identity
- API co exception middleware + logging
- Dung EF Core query de giam rui ro SQL Injection

## 8) Ghi chu mo rong de nop bai

- Co the bo sung CKEditor/TinyMCE cho WYSIWYG
- Co the bo sung upload media that (Cloudinary/Azure Blob)
- Co the bo sung phan trang, tim kiem nang cao, audit log UI

