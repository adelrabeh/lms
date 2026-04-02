# نظام إدارة الرخص — License Management System
### دارة الملك عبدالعزيز للبحوث والأرشيف

---

## هيكل المشروع

```
darah-license-management/
├── backend/                    ← ASP.NET Core 8 Web API
│   ├── Controllers/
│   ├── Models/
│   ├── Data/                   ← DbContext + Seed
│   ├── DTOs/
│   ├── Services/
│   ├── Program.cs
│   ├── appsettings.json
│   ├── Dockerfile
│   └── LicenseManagement.API.csproj
├── frontend/                   ← React 18 + Vite
│   ├── src/
│   │   ├── services/api.js     ← Axios API calls
│   │   ├── App.jsx             ← Main app + all views
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── railway.json
├── .gitignore
└── README.md
```

---

## التشغيل المحلي

### Backend
```bash
cd backend
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
# API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# عدّل VITE_API_URL في .env
npm run dev
# App: http://localhost:5173
```

---

## النشر على Railway + Vercel

### 1. رفع على GitHub
```bash
git init
git add .
git commit -m "initial: LMS full stack"
git remote add origin https://github.com/YOUR_USERNAME/darah-lms.git
git push -u origin main
```

### 2. Backend على Railway
1. railway.app → New Project → Deploy from GitHub Repo
2. اختر المجلد `backend/`
3. أضف SQL Server: New Service → Database → Add SQL Server
4. أضف متغيرات البيئة:
   ```
   ConnectionStrings__DefaultConnection = <من Railway تلقائياً>
   FRONTEND_URL = https://your-app.vercel.app
   ASPNETCORE_ENVIRONMENT = Production
   ```

### 3. Frontend على Vercel
1. vercel.com → New Project → Import from GitHub
2. Root Directory: `frontend`
3. أضف Environment Variable:
   ```
   VITE_API_URL = https://your-api.up.railway.app
   ```
4. اضغط Deploy ✓

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/licenses` | جميع الرخص (مع فلترة) |
| GET | `/api/licenses/{id}` | رخصة محددة |
| POST | `/api/licenses` | إضافة رخصة |
| PUT | `/api/licenses/{id}` | تعديل رخصة |
| DELETE | `/api/licenses/{id}` | حذف رخصة |
| GET | `/api/licenses/dashboard` | بيانات لوحة التحكم |
| GET | `/api/licenses/expiring?days=90` | الرخص المنتهية قريباً |
| GET | `/api/vendors` | الموردين |
| POST | `/api/vendors` | إضافة مورّد |
| GET | `/api/departments` | الأقسام |
| GET | `/api/employees` | الموظفون |
| POST | `/api/employees` | إضافة موظف |
| GET | `/health` | Health check |

---

## المعايير التقنية
- **Backend**: ASP.NET Core 8, Entity Framework Core, SQL Server
- **Frontend**: React 18, Vite, TanStack Query, Axios
- **Hosting**: Railway (Backend + DB) + Vercel (Frontend)
- **الامتثال**: NCA-ECC, NDMO, نضيء
